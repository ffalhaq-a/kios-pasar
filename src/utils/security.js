/**
 * Security & OWASP Defense Utility Module
 * Prevents XSS, Script Injection, Formula Injection, and Session Tampering
 */

// Secret Salt for Client-Side Session Signature Verification
const SESSION_SECRET_SALT = 'PASAR_MUKTI_MAKMUR_SESSION_SECRET_SALT_2026_V1';

// API Access Security Token for Google Apps Script Authorization
export const API_SECURITY_TOKEN = 'PASAR_SECURE_TOKEN_2026_SECRET_KEY_8921';

/**
 * Escapes HTML characters to prevent XSS (Cross-Site Scripting) Attacks
 * @param {any} str - Input value
 * @returns {string} Safe HTML escaped string
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Prevents CSV / Google Sheets Formula Injection (=, +, -, @)
 * @param {string} str - Raw user input
 * @returns {string} Safe string escaped for Google Sheets
 */
export function sanitizeFormulaInput(str) {
  if (!str) return '';
  const cleaned = String(str).trim();
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    return "'" + cleaned; // Prepend single quote so Sheets treats it as plain text
  }
  return cleaned;
}

/**
 * Generates a simple cryptographic hash signature for verifying session integrity
 * @param {Object} userObj - User session object
 * @returns {string} Signature hash
 */
export function generateSessionSignature(userObj) {
  if (!userObj) return '';
  const payload = `${userObj.username}:${userObj.role}:${userObj.nama}:${SESSION_SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'SIG_' + Math.abs(hash).toString(36);
}

/**
 * Verifies if a stored user session object has been tampered with
 * @param {Object} sessionObj - Session object from storage
 * @returns {boolean} True if authentic, False if tampered
 */
export function verifySessionIntegrity(sessionObj) {
  if (!sessionObj || !sessionObj.username || !sessionObj.signature) {
    return false;
  }
  const expectedSig = generateSessionSignature(sessionObj);
  return sessionObj.signature === expectedSig;
}
