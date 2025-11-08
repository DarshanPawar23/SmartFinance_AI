const crypto = require('crypto');
const SALT = process.env.PII_SALT || 'smartfinance_default_salt';

function hashPII(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value.trim() + SALT).digest('hex');
}

module.exports = { hashPII };
