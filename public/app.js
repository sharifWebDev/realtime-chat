const socket = io();
let currentUser = null;
let token = null;
let currentChannel = "general";
let currentChannelName = "General";
let currentChannelAvatar = "🌐";
let messageReactions = new Map();
let selectedMessageId = null;
let pendingFile = null;
let emojiPicker = null;
let allUsers = []; // Store all users for direct messages

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
            
            // Fetch all users for direct messages
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
    channelAvatarDiv.innerHTML = channelAvatar;
    
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
        const content = `
            <div class="text-center mb-4">
                <div class="text-6xl mb-2">${channel.avatar}</div>
                <h4 class="text-white font-bold">${channel.name}</h4>
                <p class="text-gray-400 text-sm">${channel.description || "No description"}</p>
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
    
    // Auto-resize textarea
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

function displayMessage(messageData) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message flex ${messageData.from === currentUser ? 'justify-end' : 'justify-start'}`;
    messageDiv.id = `msg-${messageData.id}`;
    messageDiv.dataset.messageId = messageData.id;
    
    const bubbleClass = messageData.from === currentUser 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
        : 'bg-gray-700 text-white';
    
    const reactions = messageData.reactions || {};
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
                <div class="reaction-badge ${isActive ? 'active' : ''}" onclick="toggleReaction('${messageData.id}', '${reaction}')">
                    ${reaction} ${count}
                </div>
            `;
        }
        reactionHtml += `</div>`;
    }
    
    let contentHtml = "";
    if (messageData.type === "file" && messageData.fileData) {
        const file = messageData.fileData;
        if (file.mimetype.startsWith("image/")) {
            contentHtml = `
                <div class="file-attachment">
                    <img src="${file.url}" class="image-preview max-w-full cursor-pointer rounded-lg" onclick="window.open('${file.url}', '_blank')">
                    <div class="text-xs text-gray-300 mt-1">${escapeHtml(file.filename)}</div>
                </div>
                ${messageData.message && messageData.message !== `📎 ${file.filename}` ? `<div class="mt-2">${escapeHtml(messageData.message)}</div>` : ''}
            `;
        } else {
            contentHtml = `
                <div class="file-attachment">
                    <i class="fas fa-file-alt mr-2"></i>
                    <a href="${file.url}" target="_blank" class="text-blue-400 hover:underline">${escapeHtml(file.filename)}</a>
                    <div class="text-xs text-gray-300">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
                ${messageData.message && messageData.message !== `📎 ${file.filename}` ? `<div class="mt-2">${escapeHtml(messageData.message)}</div>` : ''}
            `;
        }
    } else {
        contentHtml = `<div class="break-words">${escapeHtml(messageData.message)}</div>`;
    }
    
    messageDiv.innerHTML = `
        <div class="max-w-xs md:max-w-md ${bubbleClass} rounded-2xl p-3 shadow-md relative group">
            ${messageData.from !== currentUser ? `
                <div class="flex items-center space-x-2 mb-1">
                    <img src="${messageData.fromAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(messageData.from)}&background=random`}" class="w-5 h-5 rounded-full object-cover">
                    <div class="font-bold text-xs text-blue-300">${escapeHtml(messageData.from)}</div>
                </div>
            ` : ''}
            ${contentHtml}
            <div class="text-xs opacity-75 mt-1 flex justify-between items-center">
                <span>${new Date(messageData.timestamp).toLocaleTimeString()}</span>
                <div class="flex items-center space-x-1">
                    <div class="message-actions opacity-0 group-hover:opacity-100 transition flex space-x-1">
                        <button onclick="showReactionPicker('${messageData.id}', event)" class="hover:text-blue-300">
                            <i class="far fa-smile-wink text-xs"></i>
                        </button>
                    </div>
                    ${messageData.from === currentUser ? 
                        `<span class="message-status"><i class="fas ${messageData.status === 'seen' ? 'fa-check-double status-seen' : messageData.status === 'delivered' ? 'fa-check-double status-delivered' : 'fa-check status-sent'}"></i></span>` : 
                        ''
                    }
                </div>
            </div>
            ${reactionHtml}
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Mark as seen
    if (messageData.from !== currentUser && messageData.channelId === currentChannel) {
        socket.emit("mark seen", {
            messageId: messageData.id,
            channelId: messageData.channelId
        });
    }
    
    // Show notification
    if (messageData.from !== currentUser && document.hidden) {
        showNotification(
            `Message from ${messageData.from}`,
            messageData.message?.substring(0, 50) || "📎 File received",
            `msg-${messageData.id}`
        );
    }
}

function toggleReaction(messageId, reaction) {
    const messageDiv = document.getElementById(`msg-${messageId}`);
    const reactionBadge = Array.from(messageDiv?.querySelectorAll('.reaction-badge') || []).find(el => el.textContent.includes(reaction));
    const isActive = reactionBadge?.classList.contains('active');
    
    socket.emit("react to message", {
        messageId: messageId,
        channelId: currentChannel,
        reaction: reaction,
        remove: isActive
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
    
    // Hide after 3 seconds
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
        
        channelDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">
                <img src="${channel.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random`}" class="w-8 h-8 rounded-full object-cover">
            </div>
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
    const directMessagesDiv = document.getElementById("onlineUsers");
    if (!directMessagesDiv) return;
    
    directMessagesDiv.innerHTML = '';
    
    if (users.length === 0) {
        directMessagesDiv.innerHTML = '<div class="text-gray-500 text-sm text-center py-4">No other users found</div>';
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
            
            directMessagesDiv.appendChild(userDiv);
        }
    });
}

function toggleEmojiPicker() {
    if (!emojiPicker) {
        // Simple emoji picker fallback
        const emojis = ["😀", "😂", "😍", "🥰", "😎", "👍", "❤️", "🔥", "🎉", "😢", "😮", "😡"];
        const pickerDiv = document.getElementById("emojiPicker");
        pickerDiv.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-2 grid grid-cols-6 gap-1">
                ${emojis.map(emoji => `
                    <button onclick="insertEmoji('${emoji}')" class="text-2xl p-1 hover:bg-gray-700 rounded transition">
                        ${emoji}
                    </button>
                `).join('')}
            </div>
        `;
        emojiPicker = true;
    }
    
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

let channels = [];

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
    if (channels.length > 0 && !currentChannel) {
        const firstChannel = channels[0];
        switchChannel(firstChannel.id, firstChannel.name, firstChannel.avatar, firstChannel.description);
    }
});

socket.on("new message", (messageData) => {
    displayMessage(messageData);
});

socket.on("message history", ({ channelId, messages }) => {
    if (channelId === currentChannel) {
        messagesDiv.innerHTML = "";
        messages.forEach(msg => displayMessage(msg));
    }
});

socket.on("user list", (users) => {
    // Update online status in direct messages list
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
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement && status === "delivered") {
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
        // Update reactions display
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
        
        const existingReactions = messageElement.querySelector('.reaction-badge');
        if (existingReactions) {
            const container = existingReactions.parentElement;
            if (container) container.innerHTML = reactionHtml;
        } else {
            const bubble = messageElement.querySelector('.max-w-xs');
            if (bubble) bubble.insertAdjacentHTML('beforeend', reactionHtml);
        }
    }
});

socket.on("private chat created", ({ channelId, channelName, members }) => {
    switchChannel(channelId, channelName, "👤", `Private chat with ${members.filter(m => m !== currentUser).join(", ")}`);
    showAlert("Private Chat", `Started private chat with ${members.filter(m => m !== currentUser).join(", ")}`, "success");
});

socket.on("new private chat", ({ channelId, channelName, from, avatar }) => {
    showAlert("New Private Chat", `${from} wants to chat with you!`, "info");
    
    // Add to channels list
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
    
    // Auto-resize textarea
    messageInput.style.height = "auto";
    messageInput.style.height = `${messageInput.scrollHeight}px`;
});

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