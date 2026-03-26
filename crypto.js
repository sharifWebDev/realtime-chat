const crypto = require('crypto');

class ChatEncryption {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.saltLength = 64;
        this.tagLength = 16;
    }

    // Generate a shared secret from user keys (like WhatsApp)
    generateSharedSecret(user1Id, user2Id, masterKey) {
        const combined = `${user1Id}:${user2Id}:${masterKey}`;
        return crypto.createHash('sha256').update(combined).digest();
    }

    // Derive encryption key from shared secret
    deriveKey(sharedSecret, salt) {
        return crypto.pbkdf2Sync(sharedSecret, salt, 100000, this.keyLength, 'sha256');
    }

    // Encrypt message with authenticated encryption (AES-256-GCM)
    encrypt(message, sharedSecret) {
        try {
            const salt = crypto.randomBytes(this.saltLength);
            const iv = crypto.randomBytes(this.ivLength);
            const key = this.deriveKey(sharedSecret, salt);
            
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            
            let encrypted = cipher.update(message, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                encrypted: encrypted,
                iv: iv.toString('hex'),
                salt: salt.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.algorithm
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }

    // Decrypt message with authentication verification
    decrypt(encryptedData, sharedSecret) {
        try {
            const { encrypted, iv, salt, authTag, algorithm } = encryptedData;
            
            const key = this.deriveKey(sharedSecret, Buffer.from(salt, 'hex'));
            const decipher = crypto.createDecipheriv(
                algorithm, 
                key, 
                Buffer.from(iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message - possible tampering detected');
        }
    }

    // Generate RSA key pair for secure key exchange
    generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    // Encrypt shared secret with RSA public key
    encryptWithPublicKey(secret, publicKey) {
        const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(secret, 'utf8'));
        return encrypted.toString('base64');
    }

    // Decrypt shared secret with RSA private key
    decryptWithPrivateKey(encryptedSecret, privateKey) {
        const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedSecret, 'base64'));
        return decrypted.toString('utf8');
    }
}

module.exports = new ChatEncryption();