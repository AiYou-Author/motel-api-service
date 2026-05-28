/**
 * 一次性种入 MiniMax 系列模型的自定义价格。
 *
 * 汇率：1 USD = 7.2 CNY
 * 价格来源：用户提供的 MiniMax 报价表（CNY / 百万 tokens）
 *
 * 用法：node scripts/seed-minimax-pricing.js
 */

const redis = require('../src/models/redis')
const pricingService = require('../src/services/pricingService')

const FX_USD_PER_CNY = 1 / 7.2

// 把 CNY/MTok 转换为 USD/token
function cnyPerMTokToUsdPerToken(cnyPerMTok) {
  if (cnyPerMTok === null || cnyPerMTok === undefined) {
    return 0
  }

  return (cnyPerMTok * FX_USD_PER_CNY) / 1e6
}

// 模型 → CNY 价格表
const MODELS = [
  // M2 沿用 M2.5 标准档定价（用户选 B：保留 model 名，按 M2.5 计费）
  { model: 'MiniMax-M2', input: 2.1, output: 8.4, cacheRead: 0.21, cacheWrite: 2.625 },
  { model: 'MiniMax-M2.7', input: 2.1, output: 8.4, cacheRead: 0.42, cacheWrite: 2.625 },
  { model: 'MiniMax-M2.7-highspeed', input: 4.2, output: 16.8, cacheRead: 0.42, cacheWrite: 2.625 },
  { model: 'MiniMax-M2.5', input: 2.1, output: 8.4, cacheRead: 0.21, cacheWrite: 2.625 },
  { model: 'MiniMax-M2.5-highspeed', input: 4.2, output: 16.8, cacheRead: 0.21, cacheWrite: 2.625 },
  { model: 'M2-her', input: 2.1, output: 8.4, cacheRead: 0, cacheWrite: 0 }
]

async function main() {
  console.log(`🔌 Connecting to Redis...`)
  await redis.connect()

  console.log(`💰 Loading existing custom pricing...`)
  await pricingService.loadCustomPricing()

  let created = 0
  let updated = 0

  for (const m of MODELS) {
    const exists = !!pricingService.customPricing[m.model]
    const payload = {
      input_cost_per_token: cnyPerMTokToUsdPerToken(m.input),
      output_cost_per_token: cnyPerMTokToUsdPerToken(m.output),
      cache_read_input_token_cost: cnyPerMTokToUsdPerToken(m.cacheRead),
      cache_creation_input_token_cost: cnyPerMTokToUsdPerToken(m.cacheWrite),
      litellm_provider: 'minimax',
      mode: 'chat'
    }

    try {
      await pricingService.setCustomPricing(m.model, payload, 'seed-script')
      if (exists) {
        updated += 1
        console.log(`  ↻ updated  ${m.model}`)
      } else {
        created += 1
        console.log(`  + created  ${m.model}`)
      }
    } catch (err) {
      console.error(`  ✗ failed   ${m.model}: ${err.message}`)
    }
  }

  console.log(`\n✅ Done. created=${created}, updated=${updated}, total=${MODELS.length}`)
  console.log(`   Exchange rate used: 1 USD = 7.2 CNY`)
  console.log(`   Source: pricing:custom Redis hash`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed script failed:', err)
  process.exit(1)
})
