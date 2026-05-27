const express = require('express')
const router = express.Router()
const storeService = require('../../services/storeService')
const apiKeyService = require('../../services/apiKeyService')
const { authenticateAdmin } = require('../../middleware/auth')
const logger = require('../../utils/logger')

// GET /admin/store/orders - 订单列表
router.get('/store/orders', authenticateAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    const result = await storeService.getAllOrders({
      status: status || null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    res.json(result)
  } catch (error) {
    logger.error('❌ Error getting admin orders:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/store/orders/:id/approve - 审批订单，自动创建 API Key
router.post('/store/orders/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { id: orderId } = req.params
    const order = await storeService.getOrderRaw(orderId)

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: `Order is already ${order.status}` })
    }

    // 构建 API Key 名称
    const keyName = `[Store] ${order.planName}${order.channel ? ` · ${order.channel}` : ''} - ${order.userId || orderId}`

    // ── 组装 generateApiKey 参数 ─────────────────────────────────
    const keyOptions = {
      name: keyName,
      userId: order.userId || null,
      permissions: order.permissions || []
    }

    // 按量付费：用 creditUSD 设置 totalCostLimit
    if (order.creditUSD !== undefined && order.creditUSD !== null && order.creditUSD > 0) {
      keyOptions.totalCostLimit = parseFloat(order.creditUSD)
    }

    // 兼容旧 tokenLimit 字段
    if (order.tokenLimit !== undefined && order.tokenLimit !== null) {
      keyOptions.tokenLimit = order.tokenLimit
    }

    // 渠道对应的账号分组绑定（scheduler 原生支持 group:<id>）
    if (order.targetGroupId && order.accountType) {
      const groupBinding = `group:${order.targetGroupId}`
      switch (order.accountType) {
        case 'claude-console':
          keyOptions.claudeConsoleAccountId = groupBinding
          keyOptions.claudeAccountId = groupBinding
          break
        case 'claude':
          keyOptions.claudeAccountId = groupBinding
          break
        case 'openai':
          keyOptions.openaiAccountId = groupBinding
          break
        case 'openai-responses':
          keyOptions.openaiAccountId = groupBinding
          break
        case 'azure-openai':
          keyOptions.azureOpenaiAccountId = groupBinding
          break
        default:
          break
      }
    }

    const newKey = await apiKeyService.generateApiKey(keyOptions)

    await storeService.approveOrder(orderId, {
      apiKeyId: newKey.id,
      apiKeyValue: newKey.apiKey
    })

    logger.info(
      `✅ Admin approved order ${orderId} | channel: ${order.channel} | creditUSD: $${order.creditUSD} | API Key: ${newKey.id}`
    )
    res.json({ success: true, apiKeyId: newKey.id })
  } catch (error) {
    logger.error('❌ Error approving order:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/store/orders/:id/reject - 拒绝订单
router.post('/store/orders/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { id: orderId } = req.params
    const { reason = '' } = req.body
    const order = await storeService.rejectOrder(orderId, reason)
    res.json({ success: true, order })
  } catch (error) {
    if (error.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({ error: 'Order not found' })
    }
    if (error.message === 'ORDER_NOT_PENDING') {
      return res.status(400).json({ error: 'Order is not pending' })
    }
    logger.error('❌ Error rejecting order:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/store/config - 获取商店配置（套餐 + 收款信息）
router.get('/store/config', authenticateAdmin, async (req, res) => {
  try {
    const [plans, config] = await Promise.all([
      storeService.getPlans(false),
      storeService.getConfig()
    ])
    res.json({ plans, config })
  } catch (error) {
    logger.error('❌ Error getting store config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /admin/store/config - 更新商店配置（套餐 + 收款信息）
router.put('/store/config', authenticateAdmin, async (req, res) => {
  try {
    const { plans, config } = req.body
    const results = {}
    if (plans !== undefined) {
      results.plans = await storeService.savePlans(plans)
    }
    // 支持前端直接传顶层字段（qrCodeImage, paymentInstructions）而不包装在 config 里
    const configData =
      config !== undefined
        ? config
        : req.body.qrCodeImage !== undefined || req.body.paymentInstructions !== undefined
          ? req.body
          : null
    if (configData) {
      results.config = await storeService.saveConfig(configData)
    }
    res.json({ success: true, ...results })
  } catch (error) {
    logger.error('❌ Error updating store config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
