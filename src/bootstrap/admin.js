const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const logger = require('../utils/logger')

async function initialize(redis) {
  logger.info('🔄 Initializing admin credentials...')
  const initFilePath = path.join(__dirname, '..', '..', 'data', 'init.json')

  if (!fs.existsSync(initFilePath)) {
    logger.warn('⚠️ No admin credentials found. Please run npm run setup first.')

    return
  }

  const initData = JSON.parse(fs.readFileSync(initFilePath, 'utf8'))
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(initData.adminPassword, saltRounds)

  const adminCredentials = {
    username: initData.adminUsername,
    passwordHash,
    createdAt: initData.initializedAt || new Date().toISOString(),
    lastLogin: null,
    updatedAt: initData.updatedAt || null
  }

  await redis.setSession('admin_credentials', adminCredentials)
  logger.success('Admin credentials loaded from init.json (single source of truth)')
  logger.info(`📋 Admin username: ${adminCredentials.username}`)

  logger.info('🔒 Cleaning up invalid admin sessions...')
  await cleanupInvalidSessions(redis)
}

async function cleanupInvalidSessions(redis) {
  try {
    const client = redis.getClient()
    const sessionKeys = await redis.scanKeys('session:*')
    const dataList = await redis.batchHgetallChunked(sessionKeys)

    let validCount = 0
    let invalidCount = 0

    for (let i = 0; i < sessionKeys.length; i++) {
      const key = sessionKeys[i]

      if (key === 'session:admin_credentials') {
        continue
      }

      const sessionData = dataList[i]
      const hasUsername = !!sessionData?.username
      const hasLoginTime = !!sessionData?.loginTime

      if (!hasUsername || !hasLoginTime) {
        invalidCount++
        logger.security(
          `🔒 Removing invalid session: ${key} (username: ${hasUsername}, loginTime: ${hasLoginTime})`
        )
        await client.del(key)
      } else {
        validCount++
      }
    }

    if (invalidCount > 0) {
      logger.security(`Startup security check: Removed ${invalidCount} invalid sessions`)
    }

    logger.success(
      `Session cleanup completed: ${validCount} valid, ${invalidCount} invalid removed`
    )
  } catch (error) {
    logger.error('❌ Failed to cleanup invalid sessions:', error.message)
  }
}

module.exports = { initialize }
