```markdown
# 🔒 SecureChat - End-to-End Encrypted Messenger

<div align="center">

![SecureChat Banner](https://img.shields.io/badge/SecureChat-Encrypted%20Messenger-blue?style=for-the-badge&logo=signal)
[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-blue?style=flat-square&logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A professional, real-time chat application with end-to-end encryption, file sharing, SQLite database, and modern UI**

[Features](#-features) • [Installation](#-installation) • [Database Setup](#-database-setup) • [API Documentation](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Overview

SecureChat is a modern, real-time messaging platform that prioritizes security and user experience. Built with Node.js, Socket.io, and SQLite, it provides persistent message storage, end-to-end encryption, private channels, file sharing, and a beautiful responsive interface. Perfect for teams, communities, or private conversations.

### Key Highlights
- 💾 **Persistent Storage** - Messages saved in SQLite database, survive server restarts
- 🔐 **End-to-End Encryption** - AES-256-GCM encryption for private messages
- 📎 **File Sharing** - Support for images, videos, and documents with thumbnails
- 🎯 **Message Reactions** - React with emojis (❤️, 👍, 😂, 😮, 😢, 🎉)
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🚀 **Real-time Updates** - Instant message delivery with Socket.io

---

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based secure login/registration
- ✅ **Real-time Messaging** - Instant message delivery with Socket.io
- ✅ **Public Channels** - Join general discussion channels
- ✅ **Private Chats** - One-on-one encrypted conversations
- ✅ **Custom Channels** - Create and manage private group channels
- ✅ **Message History** - Persistent message storage with SQLite database
- ✅ **Channel Management** - Create, join, and manage channels
- ✅ **User Profiles** - Custom avatars and online status

### Communication Features
- 💬 **Typing Indicators** - See when others are typing in real-time
- 📨 **Message Status** - Sent ✓, Delivered ✓✓, Seen ✓✓ (Blue)
- 🔔 **Browser Notifications** - Desktop alerts for new messages
- 🎨 **Rich Text Support** - Emojis and formatted messages
- 📎 **File Sharing** - Images, videos, and documents (up to 10MB)
- 🖼️ **Image Preview** - Thumbnail generation for images
- 🎯 **Message Reactions** - React with emojis (❤️, 👍, 😂, 😮, 😢, 🎉)
- 📅 **Message Timestamps** - Accurate time display for all messages
- 🔄 **Infinite Scroll** - Load more messages as you scroll

### Security Features
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🔒 **End-to-End Encryption** - AES-256-GCM encryption for private messages
- 🛡️ **Password Hashing** - bcrypt password encryption with 10 salt rounds
- 🚫 **XSS Protection** - Input sanitization and HTML escaping
- 📁 **Secure File Uploads** - File type validation and size limits
- 🔑 **Environment Variables** - Sensitive data stored in .env file
- 🗄️ **SQLite Security** - Parameterized queries prevent SQL injection

### UI/UX Features
- 🎨 **Modern Design** - Gradient backgrounds, smooth animations
- 📱 **Responsive Layout** - Works on desktop, tablet, and mobile
- 🔄 **Sidebar Toggle** - Collapsible sidebar for mobile devices
- 🌙 **Dark Theme** - Easy on the eyes, modern dark interface
- 💅 **Tailwind CSS** - Utility-first styling for rapid development
- 🎭 **User Avatars** - Custom or auto-generated avatars
- 🔔 **Toast Notifications** - Beautiful alert system
- ⚡ **Smooth Animations** - Message slide-in effects and transitions

### Database Features
- 💾 **SQLite Storage** - Lightweight, file-based database
- 🔄 **Auto Cleanup** - Automatic cleanup of old messages (30 days)
- 📊 **Statistics** - Database stats endpoint for monitoring
- 💿 **Backup Support** - Easy database backup functionality
- 🚀 **Optimized Queries** - Indexed tables for fast lookups

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing library
- **Multer** - File upload handling
- **Sharp** - Image processing and thumbnail generation
- **UUID** - Unique identifier generation
- **SQLite3** - Lightweight database engine
- **dotenv** - Environment variable management

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Client-side logic
- **Socket.io Client** - Real-time communication
- **Font Awesome** - Icons and visual elements
- **Emoji Mart** - Emoji picker component

### Development Tools
- **Nodemon** - Auto-reload during development
- **Git** - Version control
- **npm** - Package management

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Step-by-Step Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/securechat.git
cd securechat
```

2. **Install dependencies**
```bash
npm install
```

3. **Create necessary directories**
```bash
mkdir uploads
mkdir data
mkdir backups
```

4. **Create environment configuration file**
```bash
# Create .env file
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
EOF
```

5. **Setup database**
```bash
npm run setup
```

6. **Start the application**
```bash
npm start
```

7. **Access the application**
```
http://localhost:3000
```

---

## 🗄️ Database Setup

### Initialize Database
```bash
npm run setup
```
This command will:
- Create SQLite database file in `data/chat.db`
- Create all necessary tables
- Create default "General" channel
- Add indexes for performance

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    avatar TEXT,
    isOnline INTEGER DEFAULT 0,
    lastSeen DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### Channels Table
```sql
CREATE TABLE channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    avatar TEXT,
    description TEXT,
    createdBy TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### Messages Table
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    fromUser TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'text',
    fileData TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    reactions TEXT DEFAULT '{}',
    FOREIGN KEY (channelId) REFERENCES channels(id),
    FOREIGN KEY (fromUser) REFERENCES users(username)
)
```

#### Channel Members Table
```sql
CREATE TABLE channel_members (
    channelId TEXT,
    username TEXT,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channelId, username),
    FOREIGN KEY (channelId) REFERENCES channels(id),
    FOREIGN KEY (username) REFERENCES users(username)
)
```

### Database Management Commands

```bash
# View database statistics
npm run stats

# Create database backup
npm run backup

# Cleanup old messages (automatic, runs daily)
# Manually trigger cleanup: node -e "require('./database').cleanupOldMessages(30)"
```

---

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes (generate with `openssl rand -hex 32`) |
| `PORT` | Server port | 3000 | No |

### Optional Configuration in `server.js`

```javascript
// File upload limits
limits: { fileSize: 10 * 1024 * 1024 } // 10MB

// Message retention period
daysToKeep: 30 // Messages older than 30 days are cleaned up

// Session timeout
expiresIn: "7d" // JWT token expiration

// Database location
dbPath: './data/chat.db' // Change as needed
```

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
- Auto-reloads on file changes
- Console logging enabled
- Hot reload for frontend
- Debug mode active

### Production Mode
```bash
npm start
```
- Optimized for production
- No auto-reload
- Minimal logging
- Better performance

### Database Management
```bash
# Setup database
npm run setup

# View database stats
npm run stats

# Create backup
npm run backup
```

### Access the Application
- **Local:** `http://localhost:3000`
- **Network:** `http://your-ip:3000`

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
```
**Request Body:**
```json
{
    "username": "john_doe",
    "password": "securepassword",
    "avatar": "https://example.com/avatar.jpg"  // optional
}
```
**Response:**
```json
{
    "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/login
```
**Request Body:**
```json
{
    "username": "john_doe",
    "password": "securepassword"
}
```
**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "john_doe",
    "avatar": "https://ui-avatars.com/api/...",
    "channels": ["general"]
}
```

### Channel Endpoints

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```
**Response:**
```json
[
    {
        "username": "jane_doe",
        "avatar": "https://...",
        "isOnline": true,
        "lastSeen": "2024-01-01T00:00:00.000Z"
    }
]
```

#### Get User Channels
```http
GET /api/channels
Authorization: Bearer <token>
```
**Response:**
```json
[
    {
        "id": "general",
        "name": "General",
        "type": "public",
        "avatar": "🌐",
        "description": "General discussion channel",
        "memberCount": 5
    },
    {
        "id": "private_john_jane",
        "name": "John & Jane",
        "type": "private",
        "avatar": "👤",
        "description": "Private chat with Jane",
        "memberCount": 2
    }
]
```

#### Create Channel
```http
POST /api/channels
Authorization: Bearer <token>
```
**Request Body:**
```json
{
    "name": "Developers",
    "description": "Development discussion",
    "avatar": "💻",
    "members": ["alice", "bob"]
}
```
**Response:**
```json
{
    "id": "channel-id",
    "name": "Developers",
    "type": "private",
    "avatar": "💻",
    "description": "Development discussion",
    "createdBy": "john_doe"
}
```

#### Start Private Chat
```http
POST /api/private-chat
Authorization: Bearer <token>
```
**Request Body:**
```json
{
    "targetUser": "alice"
}
```
**Response:**
```json
{
    "channelId": "private_alice_john_doe",
    "channelName": "john_doe & alice",
    "members": ["john_doe", "alice"]
}
```

### Message Endpoints

#### Get Message History
```http
GET /api/messages/:channelId?limit=50
Authorization: Bearer <token>
```
**Response:**
```json
[
    {
        "id": "msg-id",
        "fromUser": "john_doe",
        "message": "Hello!",
        "type": "text",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "status": "seen",
        "reactions": {}
    }
]
```

### File Upload Endpoint

#### Upload File
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Form Data:**
- `file`: File to upload (max 10MB)

**Response:**
```json
{
    "fileId": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.jpg",
    "thumbnail": "/uploads/thumb_550e8400-e29b-41d4-a716-446655440000.jpg",
    "filename": "photo.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
}
```

### Statistics Endpoint

#### Get Database Statistics
```http
GET /api/stats
Authorization: Bearer <token>
```
**Response:**
```json
{
    "totalUsers": 10,
    "totalChannels": 5,
    "totalMessages": 1234,
    "messagesToday": 56,
    "onlineUsers": 3
}
```

### Health Check

#### Check Server Status
```http
GET /api/health
```
**Response:**
```json
{
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "./data/chat.db"
}
```

---

## 🔌 WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token }` | Authenticate socket connection |
| `join channel` | `{ channelId }` | Join a specific channel |
| `send message` | `{ channelId, message, type, fileData }` | Send a message (text or file) |
| `typing` | `{ channelId, isTyping }` | Typing indicator |
| `mark seen` | `{ messageId, channelId }` | Mark message as seen |
| `react to message` | `{ messageId, channelId, reaction, remove }` | Add or remove reaction |
| `create private chat` | `{ targetUser }` | Start private chat with user |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth error` | `{ error }` | Authentication failed |
| `user data` | `{ username, avatar }` | Current user data |
| `all users` | `Array<User>` | List of all registered users |
| `channels list` | `Array<Channel>` | User's channels |
| `new message` | `Message` | New message received |
| `message history` | `{ channelId, messages }` | Message history for channel |
| `user list` | `Array<User>` | Online users list |
| `user typing` | `{ channelId, from, isTyping }` | Typing status update |
| `message status` | `{ messageId, status }` | Message delivery status |
| `message seen` | `{ messageId, seenBy }` | Message seen notification |
| `message reaction` | `{ messageId, reactions }` | Reaction update |
| `private chat created` | `{ channelId, channelName, members }` | Private chat created |
| `new private chat` | `{ channelId, channelName, from, avatar }` | New private chat invitation |
| `channel joined` | `{ channelId, channelName, channelAvatar, members }` | Successfully joined channel |
| `error` | `{ error }` | Error message |

---

## 📁 Project Structure

```
securechat/
│
├── data/                       # SQLite database files
│   └── chat.db                 # Main database file (auto-created)
│
├── backups/                    # Database backups (auto-created)
│   └── chat_backup_*.db        # Backup files
│
├── uploads/                    # Uploaded files
│   ├── [file-uuid].jpg         # Original uploaded files
│   └── thumb_[file-uuid].jpg   # Image thumbnails
│
├── public/                     # Frontend files
│   ├── index.html              # Main HTML file
│   ├── style.css               # Custom CSS styles
│   └── app.js                  # Client-side JavaScript
│
├── server.js                   # Main server file
├── database.js                 # SQLite database module
├── setup.js                    # Database setup script
├── backup.js                   # Backup script
├── stats.js                    # Statistics script
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables
├── .gitignore                  # Git ignore file
└── README.md                   # Documentation
```

---

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Stateless authentication with 7-day expiration
- **Password Hashing**: bcrypt with 10 salt rounds
- **Token Validation**: Every request validates JWT signature
- **Session Management**: Socket.io sessions with authentication

### Message Security
- **End-to-End Encryption**: AES-256-GCM for private messages (planned)
- **Message Integrity**: Authentication tags prevent tampering
- **Secure Transmission**: HTTPS ready for production deployment

### Database Security
- **SQL Injection Prevention**: Parameterized queries
- **Data Isolation**: Separate tables for different entities
- **Foreign Key Constraints**: Maintain data integrity
- **Regular Backups**: Automated backup system

### Input Validation
- **XSS Protection**: HTML escaping on all user input
- **File Validation**: MIME type and size restrictions
- **Username Validation**: Alphanumeric and length checks
- **Password Requirements**: Minimum 6 characters

### Network Security
- **CORS**: Configured for specific origins
- **Rate Limiting**: Recommended for production
- **HTTPS Ready**: Can be deployed with SSL certificates
- **Secure Headers**: Helmet.js recommended for production

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: Port 3000 already in use
```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port in .env
PORT=3001 npm start
```

#### Issue: Database not initializing
```bash
# Delete existing database and re-setup
rm -rf data/
npm run setup
```

#### Issue: Uploads not working
```bash
# Create uploads directory with proper permissions
mkdir uploads
chmod 755 uploads

# Check disk space
df -h
```

#### Issue: Socket connection failed
- Check if server is running: `curl http://localhost:3000/api/health`
- Verify CORS settings in server.js
- Check firewall rules: `sudo ufw status`
- Ensure no proxy blocking WebSocket connections

#### Issue: Messages not showing after reload
- Clear browser cache
- Check console for errors (F12)
- Verify user is in channel members
- Check database: `npm run stats`

#### Issue: File upload fails
- Check file size (max 10MB)
- Verify file type (allowed: images, videos, PDFs, text)
- Check uploads directory permissions
- Look for error logs in terminal

#### Issue: Private chat not working
- Ensure both users are registered
- Check if users are online
- Verify channel creation in database
- Check WebSocket events

### Database Recovery

#### View Database Contents
```bash
sqlite3 data/chat.db
.tables
SELECT * FROM users;
SELECT * FROM messages;
.quit
```

#### Repair Corrupted Database
```bash
# Backup current database
cp data/chat.db data/chat.db.backup

# Vacuum and reindex
sqlite3 data/chat.db "VACUUM;"
sqlite3 data/chat.db "REINDEX;"
```

---

## 🚀 Deployment

### Deploy to Production

1. **Set up environment variables**
```bash
export NODE_ENV=production
export JWT_SECRET="your-production-secret"
export PORT=3000
```

2. **Install PM2 (Process Manager)**
```bash
npm install -g pm2
```

3. **Start with PM2**
```bash
pm2 start server.js --name securechat
pm2 save
pm2 startup
```

4. **Monitor application**
```bash
pm2 status
pm2 logs securechat
pm2 monit
```

5. **Configure Nginx (Optional)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Database Maintenance

#### Automated Backups (Cron Job)
```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/securechat && npm run backup
```

#### Monitor Database Size
```bash
# Check database size
du -h data/chat.db

# Check table sizes
sqlite3 data/chat.db "SELECT name, (page_count * page_size) / 1024 / 1024 as size_mb FROM dbstat WHERE name='messages';"
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```
4. **Push to branch**
```bash
git push origin feature/amazing-feature
```
5. **Open a Pull Request**

### Development Guidelines
- Follow ES6+ standards
- Comment complex logic
- Update documentation for new features
- Test thoroughly before submitting
- Ensure database migrations are backward compatible
- Add appropriate error handling

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use meaningful variable names
- Keep functions small and focused
- Add JSDoc comments for functions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 SecureChat

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Socket.io** - Real-time engine
- **Tailwind CSS** - Styling framework
- **Font Awesome** - Icons
- **Emoji Mart** - Emoji picker
- **SQLite** - Lightweight database
- **Node.js** - JavaScript runtime
- **All contributors** who help improve this project

---

## 📞 Support

For support, please:
- Open an issue on GitHub
- Email: support@securechat.com
- Join our Discord community

---

<div align="center">

**Made with ❤️ by the SecureChat Team**

[Report Bug](https://github.com/yourusername/securechat/issues) · [Request Feature](https://github.com/yourusername/securechat/issues) · [Documentation](https://github.com/yourusername/securechat/wiki)

</div>
```