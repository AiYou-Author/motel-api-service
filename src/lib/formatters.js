function maskToken(token, visiblePercent = 70) {
  if (!token || typeof token !== 'string') {
    return '[EMPTY]'
  }

  const { length } = token

  if (length <= 2) {
    return '*'.repeat(length)
  }

  if (length <= 5) {
    return token.slice(0, 1) + '*'.repeat(length - 1)
  }

  if (length <= 10) {
    const visibleLength = Math.min(5, length - 2)
    const front = token.slice(0, visibleLength)

    return front + '*'.repeat(length - visibleLength)
  }

  const visibleLength = Math.floor(length * (visiblePercent / 100))
  const frontLength = Math.ceil(visibleLength * 0.6)
  const backLength = visibleLength - frontLength
  const front = token.slice(0, frontLength)
  const back = token.slice(-backLength)
  const middle = '*'.repeat(length - visibleLength)

  return `${front}${middle}${back}`
}

function maskTokensInObject(
  obj,
  tokenFields = ['accessToken', 'refreshToken', 'access_token', 'refresh_token']
) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const masked = { ...obj }

  tokenFields.forEach((field) => {
    if (masked[field]) {
      masked[field] = maskToken(masked[field])
    }
  })

  return masked
}

function formatDateWithTimezone(date, timezoneOffset, includeTimezone = true) {
  let dateObj

  if (typeof date === 'number') {
    if (date < 10000000000) {
      dateObj = new Date(date * 1000)
    } else {
      dateObj = new Date(date)
    }
  } else if (date instanceof Date) {
    dateObj = date
  } else {
    dateObj = new Date(date)
  }

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const tzOffsetMs = timezoneOffset * 60 * 1000
  const localDate = new Date(dateObj.getTime() + tzOffsetMs)
  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')
  const hours = String(localDate.getUTCHours()).padStart(2, '0')
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0')
  const seconds = String(localDate.getUTCSeconds()).padStart(2, '0')

  const base = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  if (includeTimezone) {
    const absOffset = Math.abs(timezoneOffset)
    const sign = timezoneOffset >= 0 ? '+' : '-'
    const tzHours = String(Math.floor(absOffset / 60)).padStart(2, '0')
    const tzMinutes = String(absOffset % 60).padStart(2, '0')

    return `${base} ${sign}${tzHours}:${tzMinutes}`
  }

  return base
}

module.exports = { maskToken, maskTokensInObject, formatDateWithTimezone }
