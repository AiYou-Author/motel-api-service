const express = require('express')
const router = express.Router()
const storeService = require('../services/storeService')
const pricingService = require('../services/pricingService')
const { authenticateUser } = require('../middleware/auth')
const logger = require('../utils/logger')

// 收集模型基础价格（每百万 token 美元）
function collectModelPricing(modelIds) {
  const pricing = {}
  for (const modelId of modelIds) {
    // 优先查 customPricing，再查 pricingData
    const custom = pricingService.customPricing?.[modelId]
    const builtin = pricingService.pricingData?.[modelId]
    const data = custom || builtin
    if (data) {
      pricing[modelId] = {
        input: data.input_cost_per_token ? data.input_cost_per_token * 1000000 : null,
        output: data.output_cost_per_token ? data.output_cost_per_token * 1000000 : null
      }
    }
  }
  return pricing
}

// GET /store/plans - 公开获取已启用套餐列表
router.get('/plans', async (req, res) => {
  try {
    const [plans, storeConfig] = await Promise.all([
      storeService.getPlans(true),
      storeService.getConfig()
    ])

    // 收集所有套餐涉及的模型价格
    const allModelIds = new Set()
    plans.forEach((p) => {
      if (Array.isArray(p.models)) {
        p.models.forEach((m) => allModelIds.add(m))
      }
    })
    const modelPricing = collectModelPricing(allModelIds)

    res.json({
      plans,
      modelPricing,
      paymentInstructions: storeConfig.paymentInstructions || '',
      qrCodeImage: storeConfig.qrCodeImage || null,
      rechargeAmounts: storeConfig.rechargeAmounts || storeService.getAllowedRechargeAmounts()
    })
  } catch (error) {
    logger.error('❌ Error getting store plans:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /store/orders - 需登录才能下单
router.post('/orders', authenticateUser, async (req, res) => {
  try {
    const { planId, amount } = req.body
    const userId = req.user?.id

    if (!planId) {
      return res.status(400).json({ error: 'planId is required' })
    }

    const plans = await storeService.getPlans(true)
    const plan = plans.find((p) => p.id === planId)
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found or disabled' })
    }

    // ── 按量付费：必须传 amount ──────────────────────────────────
    if (plan.planType === 'payg' || !plan.price) {
      const parsedAmount = Number(amount)
      const allowed = storeService.getAllowedRechargeAmounts()

      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'amount is required for pay-as-you-go plans' })
      }
      if (!allowed.includes(parsedAmount)) {
        return res.status(400).json({ error: `amount must be one of: ${allowed.join(', ')} (CNY)` })
      }

      // creditUSD = amount / serviceRate，保留 4 位小数
      const serviceRate = plan.serviceRate || 1
      const creditUSD = parseFloat((parsedAmount / serviceRate).toFixed(4))

      const order = await storeService.createOrder({
        planId: plan.id,
        planName: plan.name,
        channel: plan.channel,
        badge: plan.badge,
        serviceRate,
        amount: parsedAmount,
        creditUSD,
        currency: 'CNY',
        permissions: plan.permissions || [],
        accountType: plan.accountType || null,
        targetGroupId: plan.targetGroupId || null,
        userId
      })

      return res.status(201).json({ success: true, order })
    }

    // ── 兼容旧固定价格套餐 ────────────────────────────────────────
    const order = await storeService.createOrder({
      planId: plan.id,
      planName: plan.name,
      channel: plan.channel || null,
      badge: plan.badge || null,
      serviceRate: plan.serviceRate || null,
      amount: plan.price,
      creditUSD: plan.creditUSD || null,
      currency: plan.currency || 'CNY',
      permissions: plan.permissions || [],
      accountType: plan.accountType || null,
      targetGroupId: plan.targetGroupId || null,
      tokenLimit: plan.tokenLimit || null,
      userId
    })

    return res.status(201).json({ success: true, order })
  } catch (error) {
    logger.error('❌ Error creating order:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /store/orders - 获取当前登录用户的订单列表
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id
    const orders = await storeService.getUserOrders(userId)
    res.json({ orders })
  } catch (error) {
    logger.error('❌ Error getting user orders:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /store/orders/:orderId - 查询单个订单（需登录，且只能查自己的）
router.get('/orders/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user?.id
    const order = await storeService.getOrder(orderId)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json({ order })
  } catch (error) {
    logger.error('❌ Error getting order:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /store/orders/:orderId/note - 用户更新订单备注/支付凭证
router.patch('/orders/:orderId/note', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params
    const { note } = req.body
    const userId = req.user?.id

    const order = await storeService.getOrder(orderId)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await storeService.updateOrderNote(orderId, note)
    res.json({ success: true })
  } catch (error) {
    logger.error('❌ Error updating order note:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /store/orders/:orderId - 用户软删除订单
router.delete('/orders/:orderId', authenticateUser, async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user?.id
    const result = await storeService.deleteUserOrder(userId, orderId)
    res.json({ success: true, ...result })
  } catch (error) {
    const map = {
      ORDER_NOT_FOUND: { code: 404, msg: '订单不存在' },
      ORDER_ALREADY_DELETED: { code: 410, msg: '订单已删除' },
      ORDER_NOT_DELETABLE: { code: 400, msg: '该订单当前状态不允许删除' },
      ORDER_TOO_OLD: { code: 400, msg: '订单审批已超过 30 天，请联系客服' },
      ORDER_USAGE_TOO_HIGH: { code: 400, msg: '订单已使用超过额度的 50%，请联系客服' },
      API_KEY_DISABLE_FAILED: { code: 500, msg: '禁用 API Key 失败，订单未删除' }
    }
    const hit = map[error.message]
    if (hit) {
      return res.status(hit.code).json({ error: error.message, message: hit.msg })
    }
    logger.error('❌ Error deleting user order:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
