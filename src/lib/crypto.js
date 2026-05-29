const crypto = require('crypto')

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

function encrypt(text, encryptionKey, salt) {
  if (!text) {
    return ''
  }
  const key = crypto.scryptSync(encryptionKey, salt, 32)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')

  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

function decrypt(text, encryptionKey, salt) {
  if (!text) {
    return ''
  }
  if (!text.includes(':')) {
    return text
  }
  try {
    const key = crypto.scryptSync(encryptionKey, salt, 32)
    const [ivHex, encrypted] = text.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')

    decrypted += decipher.final('utf8')

    return decrypted
  } catch (e) {
    return text
  }
}

function sha256Hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

module.exports = { encrypt, decrypt, sha256Hash }
