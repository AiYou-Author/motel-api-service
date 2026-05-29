const logger = require('../utils/logger')
const redisBootstrap = require('./redis')
const servicesBootstrap = require('./services')
const adminBootstrap = require('./admin')

async function initialize(redis, pricingService) {
  await redisBootstrap.initialize(redis)
  await servicesBootstrap.initialize(redis, pricingService)
  await adminBootstrap.initialize(redis)
  logger.success('Bootstrap initialization complete')
}

module.exports = { initialize }
