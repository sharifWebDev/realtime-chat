const db = require('./database');
const path = require('path');
const fs = require('fs');

async function backup() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    const backupPath = path.join(backupDir, `chat_backup_${Date.now()}.db`);
    
    try {
        await db.backup(backupPath);
        console.log(`✅ Database backed up to: ${backupPath}`);
        
        // Delete backups older than 7 days
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const daysOld = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            if (daysOld > 7) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted old backup: ${file}`);
            }
        });
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

backup();