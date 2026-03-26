const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Create database directory if it doesn't exist
        const dbDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        this.dbPath = path.join(dbDir, 'chat.db');
        this.db = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                    return;
                }
                
                console.log('📁 Database connected:', this.dbPath);
                
                try {
                    // Create tables in sequence
                    await this.createTables();
                    this.initialized = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                avatar TEXT,
                isOnline INTEGER DEFAULT 0,
                lastSeen DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Channels table
            `CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                avatar TEXT,
                description TEXT,
                createdBy TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Channel members table
            `CREATE TABLE IF NOT EXISTS channel_members (
                channelId TEXT,
                username TEXT,
                joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (channelId, username),
                FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE,
                FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
            )`,
            
            // Messages table
            `CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                channelId TEXT NOT NULL,
                fromUser TEXT NOT NULL,
                message TEXT,
                type TEXT DEFAULT 'text',
                fileData TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'sent',
                reactions TEXT DEFAULT '{}',
                FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE,
                FOREIGN KEY (fromUser) REFERENCES users(username) ON DELETE CASCADE
            )`,
            
            // Private chats table
            `CREATE TABLE IF NOT EXISTS private_chats (
                id TEXT PRIMARY KEY,
                user1 TEXT NOT NULL,
                user2 TEXT NOT NULL,
                channelId TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1) REFERENCES users(username) ON DELETE CASCADE,
                FOREIGN KEY (user2) REFERENCES users(username) ON DELETE CASCADE,
                FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE,
                UNIQUE(user1, user2)
            )`,
            
            // Create indexes
            `CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channelId, timestamp DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(fromUser, timestamp DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_channel_members_channel ON channel_members(channelId)`,
            `CREATE INDEX IF NOT EXISTS idx_channel_members_user ON channel_members(username)`,
            `CREATE INDEX IF NOT EXISTS idx_private_chats_user1 ON private_chats(user1)`,
            `CREATE INDEX IF NOT EXISTS idx_private_chats_user2 ON private_chats(user2)`
        ];
        
        for (const tableSQL of tables) {
            await this.runQuery(tableSQL);
        }
        
        // Create default channel
        await this.createDefaultChannel();
        
        console.log('✅ Database tables created successfully');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async createDefaultChannel() {
        try {
            const channel = await this.getQuery('SELECT * FROM channels WHERE id = ?', ['general']);
            
            if (!channel) {
                await this.runQuery(`
                    INSERT INTO channels (id, name, type, avatar, description, createdBy)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, ['general', 'General', 'public', '🌐', 'General discussion channel', 'system']);
                console.log('✅ Default channel created');
            }
        } catch (error) {
            console.error('Error creating default channel:', error);
        }
    }

    // ========== User Methods ==========

    async createUser(username, password, avatar) {
        await this.init();
        return this.runQuery(
            'INSERT INTO users (username, password, avatar, isOnline, lastSeen) VALUES (?, ?, ?, ?, ?)',
            [username, password, avatar, 0, new Date().toISOString()]
        );
    }

    async getUser(username) {
        await this.init();
        return this.getQuery('SELECT * FROM users WHERE username = ?', [username]);
    }

    async updateUserStatus(username, isOnline) {
        await this.init();
        return this.runQuery(
            'UPDATE users SET isOnline = ?, lastSeen = CURRENT_TIMESTAMP WHERE username = ?',
            [isOnline ? 1 : 0, username]
        );
    }

    async getAllUsers() {
        await this.init();
        return this.allQuery('SELECT username, avatar, isOnline, lastSeen FROM users ORDER BY username');
    }

    // ========== Channel Methods ==========

    async createChannel(channel) {
        await this.init();
        return this.runQuery(
            `INSERT INTO channels (id, name, type, avatar, description, createdBy)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [channel.id, channel.name, channel.type, channel.avatar, channel.description, channel.createdBy]
        );
    }

    async getChannel(id) {
        await this.init();
        return this.getQuery('SELECT * FROM channels WHERE id = ?', [id]);
    }

    async getChannelMembers(channelId) {
        await this.init();
        return this.allQuery(
            `SELECT u.username, u.avatar, u.isOnline, u.lastSeen 
             FROM channel_members cm 
             JOIN users u ON cm.username = u.username 
             WHERE cm.channelId = ?`,
            [channelId]
        );
    }

    async getUserChannels(username) {
        await this.init();
        return this.allQuery(
            `SELECT c.* FROM channels c 
             JOIN channel_members cm ON c.id = cm.channelId 
             WHERE cm.username = ? 
             ORDER BY c.createdAt DESC`,
            [username]
        );
    }

    async addChannelMember(channelId, username) {
        await this.init();
        return this.runQuery(
            'INSERT OR IGNORE INTO channel_members (channelId, username) VALUES (?, ?)',
            [channelId, username]
        );
    }

    async removeChannelMember(channelId, username) {
        await this.init();
        return this.runQuery(
            'DELETE FROM channel_members WHERE channelId = ? AND username = ?',
            [channelId, username]
        );
    }

    // ========== Private Chat Methods ==========

    async createPrivateChat(user1, user2, channelId) {
        await this.init();
        return this.runQuery(
            `INSERT INTO private_chats (id, user1, user2, channelId)
             VALUES (?, ?, ?, ?)`,
            [`private_${[user1, user2].sort().join('_')}`, user1, user2, channelId]
        );
    }

    async getPrivateChat(user1, user2) {
        await this.init();
        return this.getQuery(
            `SELECT * FROM private_chats 
             WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)`,
            [user1, user2, user2, user1]
        );
    }

    async getUserPrivateChats(username) {
        await this.init();
        return this.allQuery(
            `SELECT pc.*, c.name as channelName, c.avatar as channelAvatar
             FROM private_chats pc 
             JOIN channels c ON pc.channelId = c.id
             WHERE pc.user1 = ? OR pc.user2 = ?`,
            [username, username]
        );
    }

    // ========== Message Methods ==========

    async saveMessage(message) {
        await this.init();
        return this.runQuery(
            `INSERT INTO messages (id, channelId, fromUser, message, type, fileData, status, reactions)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                message.id,
                message.channelId,
                message.from,
                message.message,
                message.type,
                message.fileData ? JSON.stringify(message.fileData) : null,
                message.status,
                JSON.stringify(message.reactions || {})
            ]
        );
    }

    async getMessages(channelId, limit = 100, offset = 0) {
        await this.init();
        const rows = await this.allQuery(
            `SELECT * FROM messages 
             WHERE channelId = ? 
             ORDER BY timestamp DESC 
             LIMIT ? OFFSET ?`,
            [channelId, limit, offset]
        );
        
        // Parse JSON fields and reverse for chronological order
        return rows.map(row => ({
            ...row,
            fileData: row.fileData ? JSON.parse(row.fileData) : null,
            reactions: row.reactions ? JSON.parse(row.reactions) : {}
        })).reverse();
    }

    async getMessagesBefore(channelId, beforeTimestamp, limit = 100) {
        await this.init();
        const rows = await this.allQuery(
            `SELECT * FROM messages 
             WHERE channelId = ? AND timestamp < ? 
             ORDER BY timestamp DESC 
             LIMIT ?`,
            [channelId, beforeTimestamp, limit]
        );
        
        return rows.map(row => ({
            ...row,
            fileData: row.fileData ? JSON.parse(row.fileData) : null,
            reactions: row.reactions ? JSON.parse(row.reactions) : {}
        })).reverse();
    }

    async updateMessageStatus(messageId, status) {
        await this.init();
        return this.runQuery(
            'UPDATE messages SET status = ? WHERE id = ?',
            [status, messageId]
        );
    }

    async updateMessageReactions(messageId, reactions) {
        await this.init();
        return this.runQuery(
            'UPDATE messages SET reactions = ? WHERE id = ?',
            [JSON.stringify(reactions), messageId]
        );
    }

    async deleteMessage(messageId) {
        await this.init();
        return this.runQuery('DELETE FROM messages WHERE id = ?', [messageId]);
    }

    // ========== Search Methods ==========

    async searchMessages(channelId, searchTerm, limit = 50) {
        await this.init();
        const rows = await this.allQuery(
            `SELECT * FROM messages 
             WHERE channelId = ? AND message LIKE ? 
             ORDER BY timestamp DESC 
             LIMIT ?`,
            [channelId, `%${searchTerm}%`, limit]
        );
        
        return rows.map(row => ({
            ...row,
            fileData: row.fileData ? JSON.parse(row.fileData) : null,
            reactions: row.reactions ? JSON.parse(row.reactions) : {}
        }));
    }

    // ========== Cleanup Methods ==========

    async cleanupOldMessages(daysToKeep = 30) {
        await this.init();
        const result = await this.runQuery(
            `DELETE FROM messages 
             WHERE timestamp < datetime('now', ?) 
             AND channelId NOT IN (SELECT id FROM channels WHERE type = 'public')`,
            [`-${daysToKeep} days`]
        );
        return result.changes;
    }

    async getDatabaseStats() {
        await this.init();
        const stats = await this.getQuery(`
            SELECT 
                (SELECT COUNT(*) FROM users) as totalUsers,
                (SELECT COUNT(*) FROM channels) as totalChannels,
                (SELECT COUNT(*) FROM messages) as totalMessages,
                (SELECT COUNT(*) FROM messages WHERE timestamp > datetime('now', '-1 day')) as messagesToday,
                (SELECT COUNT(*) FROM users WHERE isOnline = 1) as onlineUsers
        `);
        return stats;
    }

    // ========== Database Maintenance ==========

    async vacuum() {
        await this.init();
        return this.runQuery('VACUUM');
    }

    async backup(backupPath) {
        await this.init();
        return new Promise((resolve, reject) => {
            this.db.backup(backupPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Create and export a single instance
const db = new Database();

// Initialize on module load
db.init().catch(console.error);

module.exports = db;