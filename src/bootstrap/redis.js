const logger = require('../utils/logger')

async function initialize(redis) {
  logger.info('🔄 Connecting to Redis...')
  await redis.connect()
  logger.success('Redis connected successfully')

  const { getAppVersion, versionGt } = require('../utils/common/commonHelper')
  const currentVersion = getAppVersion()
  const migratedVersion = await redis.getMigratedVersion()

  if (versionGt(currentVersion, '1.1.250') && versionGt(currentVersion, migratedVersion)) {
    logger.info(`🔄 检测到新版本 ${currentVersion}，检查数据迁移...`)
    try {
      if (await redis.needsGlobalStatsMigration()) {
        await redis.migrateGlobalStats()
      }
      await redis.cleanupSystemMetrics()
    } catch (err) {
      logger.error('⚠️ 数据迁移出错，但不影响启动:', err.message)
    }
    await redis.setMigratedVersion(currentVersion)
    logger.success(`✅ 数据迁移完成，版本: ${currentVersion}`)
  }

  redis.ensureMonthlyMonthsIndex().catch((err) => {
    logger.error('📅 月份索引检查失败:', err.message)
  })

  redis.migrateUsageIndex().catch((err) => {
    logger.error('📊 Background usage index migration failed:', err)
  })

  await redis.migrateAlltimeModelStats()
}

module.exports = { initialize }
