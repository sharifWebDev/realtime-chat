```markdown
# 🔒 SecureChat - End-to-End Encrypted Messenger

<div align="center">

![SecureChat Banner](https://img.shields.io/badge/SecureChat-Encrypted%20Messenger-blue?style=for-the-badge&logo=signal)
[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**A professional, real-time chat application with end-to-end encryption, file sharing, and modern UI**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API Documentation](#-api-documentation) • [Screenshots](#-screenshots)

</div>

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [WebSocket Events](#-websocket-events)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Overview

SecureChat is a modern, real-time messaging platform that prioritizes security and user experience. Built with Node.js and Socket.io, it provides end-to-end encryption, private channels, file sharing, and a beautiful responsive interface. Perfect for teams, communities, or private conversations.

---

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based secure login/registration
- ✅ **Real-time Messaging** - Instant message delivery with Socket.io
- ✅ **Public Channels** - Join general discussion channels
- ✅ **Private Chats** - One-on-one encrypted conversations
- ✅ **Custom Channels** - Create and manage private group channels
- ✅ **Message History** - Persistent message storage with unlimited scroll

### Communication Features
- 💬 **Typing Indicators** - See when others are typing
- 📨 **Message Status** - Sent ✓, Delivered ✓✓, Seen ✓✓ (Blue)
- 🔔 **Browser Notifications** - Desktop alerts for new messages
- 🎨 **Rich Text Support** - Emojis and formatted messages
- 📎 **File Sharing** - Images, videos, and documents
- 🖼️ **Image Preview** - Thumbnail generation for images
- 🎯 **Message Reactions** - React with emojis (❤️, 👍, 😂, 😮, 😢, 🎉)

### Security Features
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🔒 **End-to-End Encryption** - AES-256-GCM encryption for private messages
- 🛡️ **Password Hashing** - bcrypt password encryption
- 🚫 **XSS Protection** - Input sanitization and HTML escaping
- 📁 **Secure File Uploads** - File type validation and size limits

### UI/UX Features
- 🎨 **Modern Design** - Gradient backgrounds, smooth animations
- 📱 **Responsive Layout** - Works on desktop, tablet, and mobile
- 🔄 **Sidebar Toggle** - Collapsible sidebar for mobile devices
- 🌙 **Dark Theme** - Easy on the eyes, modern dark interface
- 💅 **Tailwind CSS** - Utility-first styling
- 🎭 **User Avatars** - Custom or auto-generated avatars

---

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Sharp** - Image processing and thumbnails
- **UUID** - Unique identifier generation

### Frontend
- **HTML5/CSS3** - Structure and styling
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript (ES6+)** - Client-side logic
- **Socket.io Client** - Real-time communication
- **Font Awesome** - Icons
- **Emoji Mart** - Emoji picker

### Development Tools
- **Nodemon** - Auto-reload during development
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing

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

3. **Create uploads directory**
```bash
mkdir uploads
```

4. **Create environment configuration file**
```bash
# Create .env file
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
EOF
```

5. **Verify installation**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | Required (generate with `openssl rand -hex 32`) |
| `PORT` | Server port | 3000 |

### Optional Configuration

You can modify these settings in `server.js`:

```javascript
// File upload limits
limits: { fileSize: 10 * 1024 * 1024 } // 10MB

// Message history limit
if (messages.get(channelId).length > 1000) {
    messages.get(channelId).shift(); // Keep last 1000 messages
}

// Session timeout
expiresIn: "7d" // JWT token expiration
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

### Production Mode
```bash
npm start
```
- Optimized for production
- No auto-reload
- Minimal logging

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

### File Upload Endpoint

#### Upload File
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Form Data:**
- `file`: File to upload

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

---

## 🔌 WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token }` | Authenticate socket connection |
| `join channel` | `{ channelId }` | Join a specific channel |
| `send message` | `{ channelId, message, type, fileData }` | Send a message |
| `typing` | `{ channelId, isTyping }` | Typing indicator |
| `mark seen` | `{ messageId, channelId }` | Mark message as seen |
| `react to message` | `{ messageId, channelId, reaction, remove }` | Add/remove reaction |
| `create private chat` | `{ targetUser }` | Start private chat |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `auth error` | `{ error }` | Authentication failed |
| `user data` | `{ username, avatar }` | Current user data |
| `all users` | `Array<User>` | List of all users |
| `channels list` | `Array<Channel>` | User's channels |
| `new message` | `Message` | New message received |
| `message history` | `{ channelId, messages }` | Message history |
| `user list` | `Array<User>` | Online users |
| `user typing` | `{ channelId, from, isTyping }` | Typing status |
| `message status` | `{ messageId, status }` | Message delivery status |
| `message seen` | `{ messageId, seenBy }` | Message seen notification |
| `message reaction` | `{ messageId, reactions }` | Reaction update |
| `private chat created` | `{ channelId, channelName, members }` | Private chat created |
| `new private chat` | `{ channelId, channelName, from, avatar }` | New private chat invitation |

---

## 📁 Project Structure

```
securechat/
│
├── public/                     # Frontend files
│   ├── index.html             # Main HTML file
│   ├── style.css              # Custom styles
│   └── app.js                 # Client-side JavaScript
│
├── uploads/                    # Uploaded files (auto-created)
│   ├── [file-uuid].jpg
│   └── thumb_[file-uuid].jpg  # Image thumbnails
│
├── server.js                   # Main server file
├── package.json               # Dependencies and scripts
├── .env                       # Environment variables
├── .gitignore                 # Git ignore file
└── README.md                  # Documentation
```

---

## 📸 Screenshots

### Login Screen
![Login Screen](https://via.placeholder.com/800x400?text=Login+Screen)

### Main Chat Interface
![Main Chat](https://via.placeholder.com/800x400?text=Chat+Interface)

### Private Chat
![Private Chat](https://via.placeholder.com/800x400?text=Private+Chat)

### File Sharing
![File Sharing](https://via.placeholder.com/800x400?text=File+Sharing)

---

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Stateless authentication with 7-day expiration
- **Password Hashing**: bcrypt with 10 salt rounds
- **Token Validation**: Every request validates JWT signature

### Message Security
- **End-to-End Encryption**: AES-256-GCM for private messages
- **Key Exchange**: RSA key exchange for secure key sharing
- **Message Integrity**: Authentication tags prevent tampering

### Input Validation
- **XSS Protection**: HTML escaping on all user input
- **SQL Injection**: Not applicable (in-memory storage)
- **File Validation**: MIME type and size restrictions

### Network Security
- **CORS**: Configured for specific origins
- **HTTPS Ready**: Can be deployed with SSL certificates
- **Rate Limiting**: Recommended for production

---

## 🚀 Deployment

### Deploy to Production

1. **Set up environment variables**
```bash
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

4. **Configure Nginx (Optional)**
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
    }
}
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

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** Port 3000 already in use
```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

**Issue:** Uploads not working
```bash
# Create uploads directory with proper permissions
mkdir uploads
chmod 755 uploads
```

**Issue:** Socket connection failed
- Check if server is running
- Verify CORS settings
- Check firewall rules

**Issue:** Messages not showing
- Clear browser cache
- Check console for errors
- Verify user is in channel members

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
- **All contributors** who help improve this project

---

## 📞 Support

For support, email: support@securechat.com or open an issue on GitHub.

---

<div align="center">

**Made with ❤️ by the SecureChat Team**

[Report Bug](https://github.com/yourusername/securechat/issues) · [Request Feature](https://github.com/yourusername/securechat/issues)

</div>
```