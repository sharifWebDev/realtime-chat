const socket = io();
let currentUser = null;
let token = null;
let currentChannel = "general";
let currentChannelName = "General";
let currentChannelAvatar = "🌐";
let selectedMessageId = null;
let pendingFile = null;
let emojiPicker = null;
let allUsers = [];
let channels = [];

// DOM Elements
const authDiv = document.getElementById("auth");
const chatDiv = document.getElementById("chat");
const messagesDiv = document.getElementById("messages");
const onlineUsersDiv = document.getElementById("onlineUsers");
const channelListDiv = document.getElementById("channelList");
const messageInput = document.getElementById("messageInput");
const currentUserSpan = document.getElementById("currentUser");
const currentChannelSpan = document.getElementById("currentChannel");
const channelDescriptionSpan = document.getElementById("channelDescription");
const channelAvatarDiv = document.getElementById("channelAvatar");
const typingIndicatorDiv = document.getElementById("typingIndicator");
const messageStatusSpan = document.getElementById("messageStatus");
const userAvatarImg = document.getElementById("userAvatar");

// ========== Authentication ==========

async function register() {
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const avatar = document.getElementById("regAvatar").value;
    
    if (!username || !password) {
        showAlert("Error", "Please fill in all fields", "error");
        return;
    }
    
    if (password.length < 6) {
        showAlert("Error", "Password must be at least 6 characters", "error");
        return;
    }
    
    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, avatar })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert("Success", "Registration successful! Please login.", "success");
            showLogin();
        } else {
            showAlert("Error", data.error, "error");
        }
    } catch (error) {
        showAlert("Error", "Registration failed", "error");
    }
}

async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    
    if (!username || !password) {
        showAlert("Error", "Please fill in all fields", "error");
        return;
    }
    
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            currentUser = data.username;
            
            localStorage.setItem("chatToken", token);
            localStorage.setItem("chatUser", currentUser);
            
            socket.auth = { token };
            socket.connect();
            socket.emit("authenticate", token);
            
            authDiv.style.display = "none";
            chatDiv.style.display = "flex";
            currentUserSpan.textContent = currentUser;
            
            if (data.avatar) {
                userAvatarImg.src = data.avatar;
            } else {
                userAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=random`;
            }
            
            await fetchAllUsers();
            requestNotificationPermission();
            showAlert("Welcome", `Hello ${currentUser}!`, "success");
        } else {
            showAlert("Error", data.error, "error");
        }
    } catch (error) {
        showAlert("Error", "Login failed", "error");
    }
}

async function fetchAllUsers() {
    try {
        const response = await fetch("/api/users", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const users = await response.json();
        allUsers = users;
        updateDirectMessagesList(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
    }
}

function logout() {
    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");
    token = null;
    currentUser = null;
    socket.disconnect();
    
    authDiv.style.display = "flex";
    chatDiv.style.display = "none";
    showAlert("Logged Out", "See you next time!", "info");
}

function showRegister() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}

function showLogin() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}

// ========== Channel Management ==========

async function createChannel() {
    const name = document.getElementById("channelName").value;
    const description = document.getElementById("channelDesc").value;
    const avatar = document.getElementById("channelAvatar").value || "💬";
    
    if (!name) {
        showAlert("Error", "Channel name required", "error");
        return;
    }
    
    try {
        const response = await fetch("/api/channels", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, description, avatar })
        });
        
        const channel = await response.json();
        socket.emit("join channel", { channelId: channel.id });
        showAlert("Success", `Channel "${name}" created!`, "success");
        closeCreateChannelModal();
    } catch (error) {
        showAlert("Error", "Failed to create channel", "error");
    }
}

async function startPrivateChat(username) {
    if (username === currentUser) {
        showAlert("Error", "You cannot chat with yourself", "error");
        return;
    }
    
    showAlert("Info", `Starting private chat with ${username}...`, "info");
    
    try {
        const response = await fetch("/api/private-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ targetUser: username })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            socket.emit("create private chat", { targetUser: username });
            switchChannel(data.channelId, username, "👤", `Private chat with ${username}`);
        } else {
            showAlert("Error", data.error || "Failed to start private chat", "error");
        }
    } catch (error) {
        showAlert("Error", "Failed to start private chat", "error");
    }
}

function switchChannel(channelId, channelName, channelAvatar, description) {
    currentChannel = channelId;
    currentChannelName = channelName;
    currentChannelAvatar = channelAvatar;
    
    currentChannelSpan.textContent = channelName;
    channelDescriptionSpan.textContent = description || "";
    
    // Handle avatar display - if it's an emoji or URL
    if (channelAvatar && (channelAvatar.startsWith('http') || channelAvatar.startsWith('/'))) {
        channelAvatarDiv.innerHTML = `<img src="${channelAvatar}" class="w-10 h-10 rounded-full object-cover">`;
    } else {
        channelAvatarDiv.innerHTML = `<div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">${channelAvatar || "💬"}</div>`;
    }
    
    // Clear messages
    messagesDiv.innerHTML = "";
    
    // Join channel
    socket.emit("join channel", { channelId });
    
    // Highlight active channel
    document.querySelectorAll(".channel-item").forEach(el => {
        el.classList.remove("active-channel");
        if (el.dataset.channelId === channelId) {
            el.classList.add("active-channel");
        }
    });
}

function showCreateChannelModal() {
    document.getElementById("createChannelModal").classList.remove("hidden");
}

function closeCreateChannelModal() {
    document.getElementById("createChannelModal").classList.add("hidden");
    document.getElementById("channelName").value = "";
    document.getElementById("channelDesc").value = "";
    document.getElementById("channelAvatar").value = "";
}

function showChannelInfo() {
    const channel = channels.find(c => c.id === currentChannel);
    if (channel) {
        const avatarHtml = channel.avatar && (channel.avatar.startsWith('http') || channel.avatar.startsWith('/')) 
            ? `<img src="${channel.avatar}" class="w-20 h-20 rounded-full object-cover mx-auto">`
            : `<div class="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl mx-auto">${channel.avatar || "💬"}</div>`;
        
        const content = `
            <div class="text-center mb-4">
                ${avatarHtml}
                <h4 class="text-white font-bold mt-2">${escapeHtml(channel.name)}</h4>
                <p class="text-gray-400 text-sm">${escapeHtml(channel.description) || "No description"}</p>
            </div>
            <div class="border-t border-gray-700 pt-4">
                <p class="text-gray-400 text-sm">Type: ${channel.type}</p>
                <p class="text-gray-400 text-sm">Members: ${channel.memberCount || 0}</p>
            </div>
        `;
        document.getElementById("channelInfoContent").innerHTML = content;
        document.getElementById("channelInfoModal").classList.remove("hidden");
    }
}

function closeChannelInfoModal() {
    document.getElementById("channelInfoModal").classList.add("hidden");
}

// ========== Message Handling ==========

function displayMessage(messageData) {
    if (!currentUser) {
        console.warn('Current user not set');
        return;
    }
    
    // Use fromUser (from database) instead of from
    const messageFrom = messageData.fromUser || messageData.from;
    const isOwnMessage = messageFrom === currentUser;
    
    console.log('Displaying message:', messageData);
    console.log('Message from:', messageFrom, 'Current user:', currentUser, 'Is own message:', isOwnMessage);
    
    // Create message wrapper
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `message-wrapper ${isOwnMessage ? 'sent' : 'received'}`;
    messageWrapper.id = `msg-${messageData.id}`;
    messageWrapper.dataset.messageId = messageData.id;
    
    // Create message bubble
    const messageBubble = document.createElement("div");
    messageBubble.className = `message-bubble ${isOwnMessage ? 'sent' : 'received'}`;
    
    // Add sender info for received messages
    if (!isOwnMessage) {
        const senderInfo = document.createElement("div");
        senderInfo.className = "message-sender";
        const avatarUrl = messageData.fromAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(messageFrom)}&background=random`;
        senderInfo.innerHTML = `
            <img src="${avatarUrl}" alt="${escapeHtml(messageFrom)}">
            <span>${escapeHtml(messageFrom)}</span>
        `;
        messageBubble.appendChild(senderInfo);
    }
    
    // Message content
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    // Handle different message types
    if (messageData.type === "file" && messageData.fileData) {
        const file = messageData.fileData;
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            contentDiv.innerHTML = `
                <div class="file-attachment">
                    <img src="${file.url}" class="image-preview" onclick="window.open('${file.url}', '_blank')" alt="Image">
                    <div class="text-xs text-gray-300 mt-1">${escapeHtml(file.filename)}</div>
                </div>
                ${messageData.message && messageData.message !== `📎 ${file.filename}` ? `<div class="mt-2">${escapeHtml(messageData.message)}</div>` : ''}
            `;
        } else {
            contentDiv.innerHTML = `
                <div class="file-attachment">
                    <i class="fas fa-file-alt mr-2"></i>
                    <a href="${file.url}" target="_blank" class="text-blue-400 hover:underline">${escapeHtml(file.filename)}</a>
                    <div class="text-xs text-gray-300">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
                ${messageData.message && messageData.message !== `📎 ${file.filename}` ? `<div class="mt-2">${escapeHtml(messageData.message)}</div>` : ''}
            `;
        }
    } else {
        // Handle emojis and text
        const formattedMessage = messageData.message || '';
        contentDiv.innerHTML = `<div class="break-words">${escapeHtml(formattedMessage)}</div>`;
    }
    messageBubble.appendChild(contentDiv);
    
    // Message footer (timestamp and status)
    const footerDiv = document.createElement("div");
    footerDiv.className = `message-footer ${isOwnMessage ? 'sent' : 'received'}`;
    
    const timestamp = document.createElement("span");
    timestamp.textContent = new Date(messageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    footerDiv.appendChild(timestamp);
    
    // Add status for own messages
    if (isOwnMessage && messageData.status) {
        const statusSpan = document.createElement("span");
        statusSpan.className = "message-status";
        
        if (messageData.status === 'seen') {
            statusSpan.innerHTML = '<i class="fas fa-check-double status-seen"></i>';
        } else if (messageData.status === 'delivered') {
            statusSpan.innerHTML = '<i class="fas fa-check-double status-delivered"></i>';
        } else {
            statusSpan.innerHTML = '<i class="fas fa-check status-sent"></i>';
        }
        
        footerDiv.appendChild(statusSpan);
    }
    
    messageBubble.appendChild(footerDiv);
    
    // Add message actions (reaction button)
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "message-actions";
    actionsDiv.innerHTML = `
        <button onclick="showReactionPicker('${messageData.id}', event)" title="React">
            <i class="far fa-smile-wink"></i>
        </button>
    `;
    messageBubble.appendChild(actionsDiv);
    
    // Add reactions if any
    if (messageData.reactions && Object.keys(messageData.reactions).length > 0) {
        const reactionsDiv = document.createElement("div");
        reactionsDiv.className = "message-reactions";
        
        const reactionCounts = {};
        Object.values(messageData.reactions).forEach(reaction => {
            reactionCounts[reaction] = (reactionCounts[reaction] || 0) + 1;
        });
        
        for (const [reaction, count] of Object.entries(reactionCounts)) {
            const isActive = messageData.reactions[currentUser] === reaction;
            const reactionBadge = document.createElement("div");
            reactionBadge.className = `reaction-badge ${isActive ? 'active' : ''}`;
            reactionBadge.onclick = () => toggleReaction(messageData.id, reaction);
            reactionBadge.innerHTML = `${reaction} ${count}`;
            reactionsDiv.appendChild(reactionBadge);
        }
        
        messageBubble.appendChild(reactionsDiv);
    }
    
    messageWrapper.appendChild(messageBubble);
    messagesDiv.appendChild(messageWrapper);
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Mark message as seen if it's not from current user and in current channel
    if (!isOwnMessage && messageData.channelId === currentChannel) {
        socket.emit("mark seen", {
            messageId: messageData.id,
            channelId: messageData.channelId
        });
    }
    
    // Show notification for new messages
    if (!isOwnMessage && document.hidden) {
        showNotification(
            `Message from ${messageFrom}`,
            messageData.message?.substring(0, 50) || "📎 File received",
            `msg-${messageData.id}`
        );
    }
}

async function sendMessage() {
    let message = messageInput.value.trim();
    if (!message && !pendingFile) return;
    
    let messageData = {
        channelId: currentChannel,
        message: message,
        type: "text"
    };
    
    if (pendingFile) {
        messageData.type = "file";
        messageData.fileData = pendingFile;
        messageData.message = `📎 ${pendingFile.filename}`;
        pendingFile = null;
        document.getElementById("uploadProgress").classList.add("hidden");
        messageInput.placeholder = "Type a message...";
    }
    
    socket.emit("send message", messageData);
    messageInput.value = "";
    messageStatusSpan.textContent = "Sending...";
    messageInput.style.height = "auto";
}

async function uploadFile(file) {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    document.getElementById("uploadProgress").classList.remove("hidden");
    
    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
            pendingFile = data;
            showAlert("Success", "File uploaded successfully!", "success");
            messageInput.placeholder = "Add a caption (optional)...";
        } else {
            showAlert("Error", "Upload failed", "error");
        }
    } catch (error) {
        showAlert("Error", "Upload failed", "error");
    } finally {
        document.getElementById("uploadProgress").classList.add("hidden");
    }
}

function toggleReaction(messageId, reaction) {
    socket.emit("react to message", {
        messageId: messageId,
        channelId: currentChannel,
        reaction: reaction,
        remove: false
    });
}

function addReaction(reaction) {
    if (selectedMessageId) {
        toggleReaction(selectedMessageId, reaction);
        hideReactionPicker();
    }
}

function showReactionPicker(messageId, event) {
    selectedMessageId = messageId;
    const picker = document.getElementById("reactionPicker");
    const rect = event.target.getBoundingClientRect();
    
    picker.style.display = "flex";
    picker.style.top = `${rect.top - 50}px`;
    picker.style.left = `${rect.left}px`;
    
    setTimeout(() => hideReactionPicker(), 3000);
}

function hideReactionPicker() {
    document.getElementById("reactionPicker").style.display = "none";
    selectedMessageId = null;
}

// ========== UI Updates ==========

function updateChannelList(channels) {
    channelListDiv.innerHTML = '';
    
    channels.forEach(channel => {
        const channelDiv = document.createElement("div");
        channelDiv.className = `channel-item p-3 rounded cursor-pointer flex items-center space-x-3`;
        channelDiv.dataset.channelId = channel.id;
        channelDiv.onclick = () => switchChannel(channel.id, channel.name, channel.avatar, channel.description);
        
        const avatarHtml = channel.avatar && (channel.avatar.startsWith('http') || channel.avatar.startsWith('/'))
            ? `<img src="${channel.avatar}" class="w-8 h-8 rounded-full object-cover">`
            : `<div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">${channel.avatar || "💬"}</div>`;
        
        channelDiv.innerHTML = `
            ${avatarHtml}
            <div class="flex-1">
                <div class="text-white font-medium">${escapeHtml(channel.name)}</div>
                <div class="text-xs text-gray-400">${channel.memberCount || 0} members</div>
            </div>
            ${channel.unreadCount ? `<div class="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">${channel.unreadCount}</div>` : ''}
        `;
        
        channelListDiv.appendChild(channelDiv);
    });
}

function updateDirectMessagesList(users) {
    if (!onlineUsersDiv) return;
    
    onlineUsersDiv.innerHTML = '';
    
    if (users.length === 0) {
        onlineUsersDiv.innerHTML = '<div class="text-gray-500 text-sm text-center py-4">No other users found</div>';
        return;
    }
    
    users.forEach(user => {
        if (user.username !== currentUser) {
            const userDiv = document.createElement("div");
            userDiv.className = `user-item p-2 rounded cursor-pointer flex items-center space-x-3 hover:bg-gray-700 transition`;
            userDiv.onclick = () => startPrivateChat(user.username);
            
            userDiv.innerHTML = `
                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}" class="w-10 h-10 rounded-full object-cover">
                <div class="flex-1">
                    <div class="text-white text-sm font-medium">${escapeHtml(user.username)}</div>
                    <div class="text-xs ${user.isOnline ? 'text-green-400' : 'text-gray-500'}">
                        ${user.isOnline ? '<i class="fas fa-circle text-xs mr-1"></i>Online' : `Last seen ${user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : 'recently'}`}
                    </div>
                </div>
                ${user.isOnline ? '<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>' : ''}
            `;
            
            onlineUsersDiv.appendChild(userDiv);
        }
    });
}

function toggleEmojiPicker() {
    const picker = document.getElementById("emojiPicker");
    picker.classList.toggle("hidden");
}

function insertEmoji(emoji) {
    messageInput.value += emoji;
    messageInput.focus();
    document.getElementById("emojiPicker").classList.add("hidden");
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
}

// ========== Notifications ==========

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function showNotification(title, body, tag) {
    if (Notification.permission === "granted" && document.hidden) {
        new Notification(title, {
            body: body,
            icon: "/favicon.ico",
            tag: tag,
            silent: false
        });
    }
}

function showAlert(title, message, type = "info") {
    const colors = {
        success: "bg-gradient-to-r from-green-600 to-green-700",
        error: "bg-gradient-to-r from-red-600 to-red-700",
        warning: "bg-gradient-to-r from-yellow-600 to-yellow-700",
        info: "bg-gradient-to-r from-blue-600 to-blue-700"
    };
    
    const alertDiv = document.createElement("div");
    alertDiv.className = `fixed top-4 right-4 z-50 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 translate-x-full toast-notification`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3 text-xl"></i>
            <div>
                <strong class="font-bold">${title}</strong>
                <div class="text-sm">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove("translate-x-full");
    }, 100);
    
    setTimeout(() => {
        alertDiv.classList.add("translate-x-full");
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// ========== Socket Events ==========

socket.on("connect", () => {
    console.log("Socket connected");
});

socket.on("auth error", (error) => {
    showAlert("Authentication Error", error, "error");
    logout();
});

socket.on("user data", (data) => {
    if (data.avatar) {
        userAvatarImg.src = data.avatar;
    }
});

socket.on("all users", (users) => {
    allUsers = users;
    updateDirectMessagesList(users);
});

socket.on("channels list", (channelList) => {
    channels = channelList;
    updateChannelList(channels);
    if (channels.length > 0 && currentChannel === "general") {
        const firstChannel = channels[0];
        if (firstChannel) {
            switchChannel(firstChannel.id, firstChannel.name, firstChannel.avatar, firstChannel.description);
        }
    }
});

socket.on("new message", (messageData) => {
    if (messageData.channelId === currentChannel) {
        displayMessage(messageData);
    }
});

socket.on("message history", ({ channelId, messages }) => {
    if (channelId === currentChannel) {
        messagesDiv.innerHTML = "";
        messages.forEach(msg => displayMessage(msg));
        setTimeout(() => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 100);
    }
});

socket.on("user list", (users) => {
    if (allUsers.length > 0) {
        const updatedUsers = allUsers.map(user => {
            const onlineUser = users.find(u => u.username === user.username);
            return {
                ...user,
                isOnline: onlineUser ? onlineUser.isOnline : false,
                lastSeen: onlineUser ? onlineUser.lastSeen : user.lastSeen
            };
        });
        updateDirectMessagesList(updatedUsers);
    }
});

socket.on("user typing", ({ channelId, from, isTyping }) => {
    if (channelId === currentChannel && isTyping) {
        typingIndicatorDiv.innerHTML = `${from} is typing<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>`;
    } else if (channelId === currentChannel && !isTyping) {
        typingIndicatorDiv.innerHTML = "";
    }
});

socket.on("message status", ({ messageId, status }) => {
    if (status === "delivered") {
        messageStatusSpan.textContent = "Delivered";
        setTimeout(() => {
            messageStatusSpan.textContent = "";
        }, 2000);
    }
});

socket.on("message seen", ({ messageId, seenBy }) => {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const statusSpan = messageElement.querySelector('.message-status');
        if (statusSpan) {
            statusSpan.innerHTML = '<i class="fas fa-check-double status-seen"></i>';
        }
    }
});

socket.on("message reaction", ({ messageId, reactions }) => {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const reactionCounts = {};
        Object.values(reactions).forEach(reaction => {
            reactionCounts[reaction] = (reactionCounts[reaction] || 0) + 1;
        });
        
        let reactionHtml = "";
        if (Object.keys(reactionCounts).length > 0) {
            reactionHtml = `<div class="flex flex-wrap gap-1 mt-2">`;
            for (const [reaction, count] of Object.entries(reactionCounts)) {
                const isActive = reactions[currentUser] === reaction;
                reactionHtml += `
                    <div class="reaction-badge ${isActive ? 'active' : ''}" onclick="toggleReaction('${messageId}', '${reaction}')">
                        ${reaction} ${count}
                    </div>
                `;
            }
            reactionHtml += `</div>`;
        }
        
        const existingReactions = messageElement.querySelector('.message-reactions');
        if (existingReactions) {
            existingReactions.innerHTML = reactionHtml;
        } else {
            const bubble = messageElement.querySelector('.message-bubble');
            if (bubble) bubble.insertAdjacentHTML('beforeend', reactionHtml);
        }
    }
});

socket.on("private chat created", ({ channelId, channelName, members }) => {
    const otherUser = members.filter(m => m !== currentUser).join(", ");
    switchChannel(channelId, channelName, "👤", `Private chat with ${otherUser}`);
    showAlert("Private Chat", `Started private chat with ${otherUser}`, "success");
});

socket.on("new private chat", ({ channelId, channelName, from, avatar }) => {
    showAlert("New Private Chat", `${from} wants to chat with you!`, "info");
    
    const newChannel = {
        id: channelId,
        name: from,
        type: "private",
        avatar: avatar || "👤",
        description: `Private chat with ${from}`,
        memberCount: 2,
        isPrivate: true,
        otherUser: from
    };
    
    channels.push(newChannel);
    updateChannelList(channels);
});

// Typing indicator
let typingTimeout;
if (messageInput) {
    messageInput.addEventListener("input", () => {
        if (typingTimeout) clearTimeout(typingTimeout);
        
        socket.emit("typing", {
            channelId: currentChannel,
            isTyping: true
        });
        
        typingTimeout = setTimeout(() => {
            socket.emit("typing", {
                channelId: currentChannel,
                isTyping: false
            });
        }, 1000);
        
        messageInput.style.height = "auto";
        messageInput.style.height = `${messageInput.scrollHeight}px`;
    });
}

// Auto-login check
const savedToken = localStorage.getItem("chatToken");
const savedUser = localStorage.getItem("chatUser");
if (savedToken && savedUser) {
    token = savedToken;
    currentUser = savedUser;
    socket.auth = { token };
    socket.connect();
    socket.emit("authenticate", token);
    authDiv.style.display = "none";
    chatDiv.style.display = "flex";
    currentUserSpan.textContent = currentUser;
    requestNotificationPermission();
    fetchAllUsers();
    userAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser)}&background=random`;
}

// Click outside to close reaction picker
document.addEventListener("click", (e) => {
    if (!e.target.closest("#reactionPicker")) {
        hideReactionPicker();
    }
    if (!e.target.closest("#emojiPicker") && !e.target.closest("[onclick='toggleEmojiPicker()']")) {
        const picker = document.getElementById("emojiPicker");
        if (picker) picker.classList.add("hidden");
    }
});