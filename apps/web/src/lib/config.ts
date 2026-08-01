/**
 * Web Configuration & Secure Hashed Credentials
 * 
 * To change your admin password:
 * 1. Choose a new password (e.g. "MyNewPassword123!")
 * 2. Generate its SHA-256 hash using a terminal or online tool.
 *    For example, in a terminal:
 *    node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
 * 3. Replace the ADMIN_PASSWORD_HASH below with your new hash.
 */

// SHA-256 hash for username "admin"
export const ADMIN_USERNAME = 'admin';

// SHA-256 hash for password "Admin@2026!"
export const ADMIN_PASSWORD_HASH = 'f0ce0e86206541c60bc47be815f83eba98004f63c883e6d71ff5cc929cb5f9ca';

/**
 * Computes the SHA-256 hash of a string using the browser's native Web Crypto API.
 * This runs entirely client-side, is 100% zero-knowledge, and requires no external libraries.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
