/**
 * Encryption Utility Module
 * Provides AES-256-GCM encryption for sensitive data fields
 * Implementado seguindo auditoria de segurança (04/01/2026) - Fase 3
 */

import crypto from 'crypto';

// Validar ENCRYPTION_KEY ao carregar módulo
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    console.warn('⚠️  WARNING: ENCRYPTION_KEY not set. Sensitive data encryption disabled.');
    console.warn('⚠️  Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a text string using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encryptField(text: string | null | undefined): string | null {
    // Se não há texto ou não há chave de criptografia, retornar como está
    if (!text || !ENCRYPTION_KEY) {
        return text || null;
    }

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(
            ALGORITHM,
            Buffer.from(ENCRYPTION_KEY, 'hex'),
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Formato: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Error encrypting field:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypts an encrypted string
 * @param encryptedText - Encrypted string in format: iv:authTag:encrypted
 * @returns Decrypted plain text
 */
export function decryptField(encryptedText: string | null | undefined): string | null {
    // Se não há texto ou não há chave, retornar como está
    if (!encryptedText || !ENCRYPTION_KEY) {
        return encryptedText || null;
    }

    // Se não está no formato esperado, assumir que não está criptografado
    if (!encryptedText.includes(':')) {
        return encryptedText;
    }

    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            // Formato inválido, retornar como está
            return encryptedText;
        }

        const [ivHex, authTagHex, encrypted] = parts;

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            Buffer.from(ENCRYPTION_KEY, 'hex'),
            iv
        );

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Error decrypting field:', error);
        // Em caso de erro, retornar null para evitar expor dados corrompidos
        return null;
    }
}

/**
 * Encrypts an entire address object
 * @param address - Address object with street, number, etc.
 * @returns Address object with encrypted sensitive fields
 */
export function encryptAddress(address: any): any {
    if (!address) return null;

    return {
        ...address,
        street: encryptField(address.street),
        complement: encryptField(address.complement),
        neighborhood: address.neighborhood, // Bairro pode ficar sem criptografia
        city: address.city,
        state: address.state,
        zipCode: address.zipCode
    };
}

/**
 * Decrypts an address object
 * @param address - Encrypted address object
 * @returns Address object with decrypted fields
 */
export function decryptAddress(address: any): any {
    if (!address) return null;

    return {
        ...address,
        street: decryptField(address.street),
        complement: decryptField(address.complement)
    };
}

/**
 * Helper to encrypt customer sensitive data before saving
 */
export function encryptCustomerData(data: any): any {
    return {
        ...data,
        cpf: data.cpf ? encryptField(data.cpf) : null,
        rg: data.rg ? encryptField(data.rg) : null,
        address: data.address ? encryptAddress(data.address) : null
    };
}

/**
 * Helper to decrypt customer sensitive data after fetching
 */
export function decryptCustomerData(data: any): any {
    if (!data) return null;

    return {
        ...data,
        cpf: decryptField(data.cpf),
        rg: decryptField(data.rg),
        address: data.address ? decryptAddress(data.address) : null
    };
}

/**
 * Generate a secure encryption key (for setup)
 * Use: node -e "console.log(require('./encryption').generateEncryptionKey())"
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifica se o módulo de criptografia está configurado
 */
export function isEncryptionEnabled(): boolean {
    return !!ENCRYPTION_KEY;
}
