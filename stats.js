const db = require('./database');

async function showStats() {
    try {
        // Wait for database initialization
        await db.init();
        
        const stats = await db.getDatabaseStats();
        
        console.log('\n📊 Database Statistics');
        console.log('=====================');
        console.log(`👥 Total Users: ${stats.totalUsers || 0}`);
        console.log(`💬 Total Channels: ${stats.totalChannels || 0}`);
        console.log(`💌 Total Messages: ${stats.totalMessages || 0}`);
        console.log(`📨 Messages Today: ${stats.messagesToday || 0}`);
        console.log(`🟢 Online Users: ${stats.onlineUsers || 0}`);
        console.log('\n💾 Database Location:', db.dbPath);
        
        // Show last 5 messages if any
        if (stats.totalMessages > 0) {
            const messages = await db.getMessages('general', 5);
            if (messages && messages.length > 0) {
                console.log('\n📝 Last 5 Messages in General Channel:');
                messages.forEach(msg => {
                    const preview = msg.message ? msg.message.substring(0, 50) : '[File/Media]';
                    console.log(`  ${new Date(msg.timestamp).toLocaleString()} | ${msg.fromUser}: ${preview}`);
                });
            }
        } else {
            console.log('\n📝 No messages yet. Start chatting!');
        }
        
        // Show online users
        const allUsers = await db.getAllUsers();
        const onlineUsers = allUsers.filter(u => u.isOnline === 1);
        if (onlineUsers.length > 0) {
            console.log('\n🟢 Currently Online Users:');
            onlineUsers.forEach(user => {
                console.log(`  - ${user.username}`);
            });
        }
        
        // Show database file size
        const fs = require('fs');
        if (fs.existsSync(db.dbPath)) {
            const stats = fs.statSync(db.dbPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            console.log(`\n💿 Database Size: ${fileSizeInMB.toFixed(2)} MB`);
        }
        
    } catch (error) {
        console.error('❌ Error getting stats:', error.message);
        console.log('\n💡 Tip: Make sure the server has been started at least once to create the database.');
    } finally {
        // Don't close the database if other processes might need it
        // db.close();
    }
}

// Run the stats function
showStats();