// lib\util\crypto.ts
// AES-256-CBC encryption & decryption utilities (v3) with TS overload bypasses

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Buffer } from 'buffer';

// Algorithm & IV length
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Load 32-byte hex key from env
const KEY_HEX = process.env.ENCRYPTION_KEY;
if (!KEY_HEX) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
// Buffer holds the raw key bytes
const KEY = Buffer.from(KEY_HEX, 'hex');

/**
 * Encrypt plaintext using AES-256-CBC. Returns "ivHex:cipherHex".
 */
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  // @ts-ignore: bypass TS type checks for Buffer key and IV
  const cipher = createCipheriv(ALGORITHM, KEY, iv);

  // @ts-ignore: allow Buffer result from update
  const encryptedPart1 = cipher.update(text, 'utf8');
  // @ts-ignore: allow Buffer result from final
  const encryptedPart2 = cipher.final();

  // @ts-ignore: bypass TS concat signature
  const encrypted = Buffer.concat([encryptedPart1, encryptedPart2]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt "ivHex:cipherHex" back to plaintext.
 */
export function decrypt(enc: string): string {
  const [ivHex, cipherHex] = enc.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  // @ts-ignore: treat Buffer as valid input
  const encryptedData = Buffer.from(cipherHex, 'hex');

  // @ts-ignore: bypass TS type checks for Buffer key and IV
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);

  // @ts-ignore: allow Buffer result from update
  const decryptedPart1 = decipher.update(encryptedData);
  // @ts-ignore: allow Buffer result from final
  const decryptedPart2 = decipher.final();

  // @ts-ignore: bypass TS concat signature
  const decrypted = Buffer.concat([decryptedPart1, decryptedPart2]);

  return decrypted.toString('utf8');
}
