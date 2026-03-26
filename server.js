const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const db = require("./database"); // Import database
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Create uploads directory
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// In-memory cache for online users (for quick access)
const onlineUsers = new Map(); // socketId => username
const userSockets = new Map(); // username => socketId

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ========== REST API Routes ==========

app.post("/api/register", async (req, res) => {
  const { username, password, avatar } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = await db.getUser(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
    
    await db.createUser(username, hashedPassword, userAvatar);
    
    // Add user to default channel
    await db.addChannelMember("general", username);
    
    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const user = await db.getUser(username);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
    
    // Get user channels
    const channels = await db.getUserChannels(username);
    
    res.json({ 
      token, 
      username,
      avatar: user.avatar,
      channels: channels.map(c => c.id)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const filteredUsers = users.filter(user => user.username !== req.user.username);
    res.json(filteredUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/channels", authenticateToken, async (req, res) => {
  try {
    const channels = await db.getUserChannels(req.user.username);
    const channelDetails = await Promise.all(channels.map(async (channel) => {
      const members = await db.getChannelMembers(channel.id);
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        avatar: channel.avatar,
        description: channel.description,
        memberCount: members.length,
        unreadCount: 0
      };
    }));
    res.json(channelDetails);
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
  }
});

app.post("/api/channels", authenticateToken, async (req, res) => {
  const { name, description, avatar, members = [] } = req.body;
  const username = req.user.username;
  
  const channelId = uuidv4();
  const channel = {
    id: channelId,
    name: name,
    description: description || "",
    avatar: avatar || "💬",
    type: "private",
    createdBy: username
  };
  
  try {
    await db.createChannel(channel);
    
    // Add creator to channel
    await db.addChannelMember(channelId, username);
    
    // Add other members
    for (const member of members) {
      await db.addChannelMember(channelId, member);
    }
    
    res.json(channel);
  } catch (error) {
    console.error("Channel creation error:", error);
    res.status(500).json({ error: "Failed to create channel" });
  }
});

app.post("/api/private-chat", authenticateToken, async (req, res) => {
  const { targetUser } = req.body;
  const currentUser = req.user.username;
  
  if (currentUser === targetUser) {
    return res.status(400).json({ error: "Cannot chat with yourself" });
  }
  
  try {
    const targetUserData = await db.getUser(targetUser);
    if (!targetUserData) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Create unique channel ID for private chat
    const channelId = `private_${[currentUser, targetUser].sort().join('_')}`;
    let channel = await db.getChannel(channelId);
    
    if (!channel) {
      channel = {
        id: channelId,
        name: `${currentUser} & ${targetUser}`,
        type: "private",
        createdBy: currentUser,
        avatar: targetUserData.avatar || "💬",
        description: `Private chat with ${targetUser}`
      };
      
      await db.createChannel(channel);
      await db.addChannelMember(channelId, currentUser);
      await db.addChannelMember(channelId, targetUser);
      await db.createPrivateChat(currentUser, targetUser, channelId);
    }
    
    res.json({
      channelId: channel.id,
      channelName: channel.name,
      members: [currentUser, targetUser]
    });
  } catch (error) {
    console.error("Private chat creation error:", error);
    res.status(500).json({ error: "Failed to create private chat" });
  }
});

app.get("/api/messages/:channelId", authenticateToken, async (req, res) => {
  const { channelId } = req.params;
  const limit = parseInt(req.query.limit) || 100;
  
  try {
    const messages = await db.getMessages(channelId, limit);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/upload", authenticateToken, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Generate thumbnail for images
    let thumbnail = null;
    if (file.mimetype.startsWith("image/")) {
      const thumbnailPath = `uploads/thumb_${file.filename}`;
      await sharp(file.path)
        .resize(200, 200, { fit: "cover" })
        .toFile(thumbnailPath);
      thumbnail = `/uploads/thumb_${file.filename}`;
    }
    
    res.json({
      fileId: file.filename,
      url: `/uploads/${file.filename}`,
      thumbnail: thumbnail,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ========== Socket.IO Events ==========

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  let currentUser = null;

  socket.on("authenticate", async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUser = decoded.username;
      
      // Update user status in database
      await db.updateUserStatus(currentUser, true);
      
      // Get user from database
      const user = await db.getUser(currentUser);
      
      if (user) {
        // Store socket mapping
        onlineUsers.set(socket.id, currentUser);
        userSockets.set(currentUser, socket.id);
        
        // Get user channels
        const userChannels = await db.getUserChannels(currentUser);
        
        // Join all channels
        for (const channel of userChannels) {
          socket.join(channel.id);
        }
        
        // Send channel list
        const channelList = await Promise.all(userChannels.map(async (channel) => {
          const members = await db.getChannelMembers(channel.id);
          return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            avatar: channel.avatar,
            description: channel.description,
            memberCount: members.length
          };
        }));
        
        socket.emit("channels list", channelList);
        
        // Get all users for direct messages
        const allUsers = await db.getAllUsers();
        socket.emit("all users", allUsers.filter(u => u.username !== currentUser));
        
        // Load messages for default channel
        if (userChannels.length > 0) {
          const messages = await db.getMessages(userChannels[0].id, 100);
          socket.emit("message history", {
            channelId: userChannels[0].id,
            messages: messages
          });
        }
        
        // Send user data
        socket.emit("user data", {
          username: currentUser,
          avatar: user.avatar
        });
        
        // Broadcast user list update
        broadcastUserList();
      }
    } catch (err) {
      console.error("Auth error:", err);
      socket.emit("auth error", "Authentication failed");
    }
  });

  // Join channel
  socket.on("join channel", async ({ channelId }) => {
    if (!currentUser) return;
    
    try {
      const channel = await db.getChannel(channelId);
      const members = await db.getChannelMembers(channelId);
      const isMember = members.some(m => m.username === currentUser);
      
      if (channel && isMember) {
        socket.join(channelId);
        
        // Send channel info
        socket.emit("channel joined", {
          channelId,
          channelName: channel.name,
          channelAvatar: channel.avatar,
          members: members
        });
        
        // Load channel messages
        const channelMessages = await db.getMessages(channelId, 100);
        socket.emit("message history", {
          channelId,
          messages: channelMessages
        });
      } else {
        socket.emit("error", "Channel not found or access denied");
      }
    } catch (error) {
      console.error("Error joining channel:", error);
      socket.emit("error", "Failed to join channel");
    }
  });

  // Send message
  socket.on("send message", async ({ channelId, message, type = "text", fileData = null }) => {
    if (!currentUser) return;
    
    try {
      const members = await db.getChannelMembers(channelId);
      const isMember = members.some(m => m.username === currentUser);
      
      if (!isMember) {
        socket.emit("error", "You are not a member of this channel");
        return;
      }
      
      const user = await db.getUser(currentUser);
      
      const messageData = {
        id: uuidv4(),
        from: currentUser,
        fromAvatar: user?.avatar,
        channelId: channelId,
        message: message,
        type: type,
        fileData: fileData,
        timestamp: new Date().toISOString(),
        status: "sent",
        reactions: {}
      };
      
      // Save to database
      await db.saveMessage(messageData);
      
      // Send to all members in channel
      io.to(channelId).emit("new message", messageData);
      
      // Update status
      await db.updateMessageStatus(messageData.id, "delivered");
      socket.emit("message status", {
        messageId: messageData.id,
        status: "delivered"
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", "Failed to send message");
    }
  });

  // React to message
  socket.on("react to message", async ({ messageId, channelId, reaction, remove = false }) => {
    if (!currentUser) return;
    
    try {
      const messages = await db.getMessages(channelId, 1000);
      const message = messages.find(m => m.id === messageId);
      
      if (message) {
        if (!message.reactions) message.reactions = {};
        
        if (remove) {
          delete message.reactions[currentUser];
        } else {
          message.reactions[currentUser] = reaction;
        }
        
        await db.updateMessageReactions(messageId, message.reactions);
        
        // Broadcast reaction update
        io.to(channelId).emit("message reaction", {
          messageId,
          channelId,
          reactions: message.reactions,
          user: currentUser,
          reaction: remove ? null : reaction
        });
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  });

  // Typing indicator
  socket.on("typing", ({ channelId, isTyping }) => {
    if (!currentUser) return;
    
    socket.to(channelId).emit("user typing", {
      channelId,
      from: currentUser,
      isTyping
    });
  });

  // Mark message as seen
  socket.on("mark seen", async ({ messageId, channelId }) => {
    if (!currentUser) return;
    
    try {
      await db.updateMessageStatus(messageId, "seen");
      
      const messages = await db.getMessages(channelId, 1000);
      const message = messages.find(m => m.id === messageId);
      
      if (message && message.from !== currentUser) {
        const senderSocketId = userSockets.get(message.from);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message seen", {
            messageId,
            channelId,
            seenBy: currentUser,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  });

  // Create private chat
  socket.on("create private chat", async ({ targetUser }) => {
    if (!currentUser || currentUser === targetUser) return;
    
    try {
      const channelId = `private_${[currentUser, targetUser].sort().join('_')}`;
      let channel = await db.getChannel(channelId);
      
      if (!channel) {
        const targetUserData = await db.getUser(targetUser);
        const currentUserData = await db.getUser(currentUser);
        
        channel = {
          id: channelId,
          name: `${currentUser} & ${targetUser}`,
          type: "private",
          createdBy: currentUser,
          avatar: targetUserData?.avatar || "💬",
          description: `Private chat with ${targetUser}`
        };
        
        await db.createChannel(channel);
        await db.addChannelMember(channelId, currentUser);
        await db.addChannelMember(channelId, targetUser);
        await db.createPrivateChat(currentUser, targetUser, channelId);
        
        // Notify target user if online
        const targetSocketId = userSockets.get(targetUser);
        if (targetSocketId) {
          io.to(targetSocketId).emit("new private chat", {
            channelId,
            channelName: channel.name,
            from: currentUser,
            avatar: currentUserData?.avatar
          });
          
          // Send updated channel list to target user
          const targetChannels = await db.getUserChannels(targetUser);
          const targetChannelList = await Promise.all(targetChannels.map(async (ch) => {
            const members = await db.getChannelMembers(ch.id);
            return {
              id: ch.id,
              name: ch.name,
              type: ch.type,
              avatar: ch.avatar,
              description: ch.description,
              memberCount: members.length
            };
          }));
          io.to(targetSocketId).emit("channels list", targetChannelList);
        }
      }
      
      // Join the channel
      socket.join(channelId);
      
      // Send response to creator
      socket.emit("private chat created", {
        channelId,
        channelName: channel.name,
        members: [currentUser, targetUser]
      });
      
      // Load messages
      const channelMessages = await db.getMessages(channelId, 100);
      socket.emit("message history", {
        channelId,
        messages: channelMessages
      });
    } catch (error) {
      console.error("Error creating private chat:", error);
      socket.emit("error", "Failed to create private chat");
    }
  });

  socket.on("disconnect", async () => {
    if (currentUser) {
      await db.updateUserStatus(currentUser, false);
      broadcastUserList();
      onlineUsers.delete(socket.id);
      userSockets.delete(currentUser);
    }
    console.log("User disconnected:", socket.id);
  });
});

async function broadcastUserList() {
  try {
    const users = await db.getAllUsers();
    io.emit("user list", users);
  } catch (error) {
    console.error("Failed to broadcast user list:", error);
  }
}

// Cleanup old messages every day
setInterval(async () => {
  try {
    const deleted = await db.cleanupOldMessages(30);
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} old messages`);
    }
  } catch (error) {
    console.error("Error cleaning up messages:", error);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

// Database stats endpoint
app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await db.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    database: db.dbPath
  });
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database
    await db.init();
    console.log('✅ Database initialized successfully');
    console.log(`📁 Database location: ${db.dbPath}`);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✓ Set' : '✗ Not set (using default)'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await db.close();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();