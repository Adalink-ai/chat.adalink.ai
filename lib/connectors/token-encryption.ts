import crypto from 'node:crypto';

/**
 * Utility functions for encrypting and decrypting OAuth tokens
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * Key should be a 32-byte base64 encoded string
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CONNECTORS_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'CONNECTORS_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: openssl rand -base64 32',
    );
  }

  try {
    const keyBuffer = Buffer.from(key, 'base64');

    if (keyBuffer.length !== 32) {
      throw new Error(
        `Encryption key must be 32 bytes (256 bits). Current length: ${keyBuffer.length} bytes`,
      );
    }

    return keyBuffer;
  } catch (error) {
    throw new Error(
      `Invalid CONNECTORS_ENCRYPTION_KEY format. ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Encrypt a plaintext token
 * @param plaintext - The token to encrypt
 * @returns Base64 encoded encrypted data (salt + iv + tag + ciphertext)
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  const key = getEncryptionKey();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the data
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted data
  const result = Buffer.concat([salt, iv, tag, encrypted]);

  // Return as base64 string
  return result.toString('base64');
}

/**
 * Decrypt an encrypted token
 * @param ciphertext - Base64 encoded encrypted data
 * @returns Decrypted plaintext token
 */
export function decryptToken(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty ciphertext');
  }

  const key = getEncryptionKey();

  // Decode from base64
  const buffer = Buffer.from(ciphertext, 'base64');

  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = buffer.subarray(ENCRYPTED_POSITION);

  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(
      `Failed to decrypt token. The data may be corrupted or the encryption key may be incorrect. ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Check if encryption is properly configured
 * @returns true if encryption key is set and valid
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
