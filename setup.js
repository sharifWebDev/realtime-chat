const db = require('./database');

async function setup() {
    console.log('🔧 Setting up database...');
    
    try {
        await db.init();
        console.log('✅ Database initialized successfully');
        
        // Create a test user (optional)
        const testUser = await db.getUser('testuser');
        if (!testUser) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('test123', 10);
            await db.createUser('testuser', hashedPassword, 'https://ui-avatars.com/api/?name=Test&background=random');
            console.log('✅ Test user created (username: testuser, password: test123)');
        }
        
        // Show stats
        const stats = await db.getDatabaseStats();
        console.log('\n📊 Database Statistics:');
        console.log(`   Users: ${stats.totalUsers}`);
        console.log(`   Channels: ${stats.totalChannels}`);
        console.log(`   Messages: ${stats.totalMessages}`);
        
        console.log('\n🎉 Setup complete! You can now start the server with: npm start');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        db.close();
    }
}

setup();