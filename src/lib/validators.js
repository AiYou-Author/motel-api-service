function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    throw new Error('用户名必须是非空字符串')
  }

  const trimmed = username.trim()

  if (trimmed.length < 3 || trimmed.length > 64) {
    throw new Error('用户名长度必须在3-64个字符之间')
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/

  if (!usernameRegex.test(trimmed)) {
    throw new Error('用户名只能包含字母、数字、下划线和连字符')
  }

  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    throw new Error('用户名不能以连字符开头或结尾')
  }

  return trimmed
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('电子邮件必须是非空字符串')
  }

  const trimmed = email.trim().toLowerCase()

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmed)) {
    throw new Error('电子邮件格式无效')
  }

  if (trimmed.length > 254) {
    throw new Error('电子邮件地址过长')
  }

  return trimmed
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('密码必须是非空字符串')
  }

  if (password.length < 8) {
    throw new Error('密码至少需要8个字符')
  }

  return true
}

function validateNonEmptyString(value) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('必须是非空字符串')
  }

  return value.trim()
}

module.exports = { validateUsername, validateEmail, validatePassword, validateNonEmptyString }
