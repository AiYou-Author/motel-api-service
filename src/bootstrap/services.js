const logger = require('../utils/logger')

async function initialize(redis, pricingService) {
  // 账户余额查询服务
  try {
    const accountBalanceService = require('../services/account/accountBalanceService')
    const { registerAllProviders } = require('../services/balanceProviders')

    registerAllProviders(accountBalanceService)
    logger.info('✅ 账户余额查询服务已初始化')
  } catch (error) {
    logger.warn('⚠️ 账户余额查询服务初始化失败:', error.message)
  }

  logger.info('🔄 Initializing pricing service...')
  await pricingService.initialize()

  logger.info('🔄 Initializing model service...')
  const modelService = require('../services/routing/modelService')

  await modelService.initialize()

  logger.info('💰 Checking cost data initialization...')
  const costInitService = require('../services/billing/costInitService')
  const needsInit = await costInitService.needsInitialization()

  if (needsInit) {
    logger.info('💰 Initializing cost data for all API Keys...')
    const result = await costInitService.initializeAllCosts()

    logger.info(
      `💰 Cost initialization completed: ${result.processed} processed, ${result.errors} errors`
    )
  }

  try {
    logger.info('💰 Backfilling current-week Claude weekly cost...')
    const weeklyClaudeCostInitService = require('../services/billing/weeklyClaudeCostInitService')

    await weeklyClaudeCostInitService.backfillCurrentWeekClaudeCosts()
  } catch (error) {
    logger.warn('⚠️ Weekly Claude cost backfill failed (startup continues):', error.message)
  }

  logger.info('🕐 Initializing Claude account session windows...')
  const claudeAccountService = require('../services/account/claude/ClaudeAccountService')

  await claudeAccountService.initializeSessionWindows()

  logger.info('📊 Initializing cost rank service...')
  const costRankService = require('../services/billing/costRankService')

  await costRankService.initialize()

  logger.info('🔍 Initializing API Key index service...')
  const apiKeyIndexService = require('../services/auth/apiKeyIndexService')

  apiKeyIndexService.init(redis)
  await apiKeyIndexService.checkAndRebuild()

  const accountGroupService = require('../services/accountGroupService')

  accountGroupService.ensureReverseIndexes().catch((err) => {
    logger.error('📁 Account group reverse index migration failed:', err)
  })
}

module.exports = { initialize }
