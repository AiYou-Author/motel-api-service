const redis = require('../models/redis')
const crypto = require('crypto')
const logger = require('../utils/logger')
const accountGroupService = require('./accountGroupService')

// ─── 默认套餐（参照 Pincc 定价，Redis 无数据时回退）──────────────
const DEFAULT_PLANS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    badge: 'Claude',
    badgeColor: 'orange',
    description: '官方 Claude 系列模型，专为 Claude Code CLI / Cursor 等工具优化',
    planType: 'payg',
    channel: 'claude-code',
    serviceRate: 2.0,
    permissions: ['claude'],
    accountType: 'claude-console',
    targetGroupId: 'store-claude-code',
    models: [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'claude-3-5-sonnet',
      'claude-3-5-haiku'
    ],
    features: ['支持 thinking', '200k 上下文', '原生 tool use', '适配 Claude Code CLI'],
    warnings: [],
    enabled: true
  },
  {
    id: 'codex',
    name: 'Codex',
    badge: 'Codex',
    badgeColor: 'green',
    description: 'OpenAI Codex / GPT 系列，覆盖最新 gpt-5 codex 模型',
    planType: 'payg',
    channel: 'codex',
    serviceRate: 0.6,
    permissions: ['openai'],
    accountType: 'openai',
    targetGroupId: 'store-codex',
    models: ['gpt-5-codex', 'gpt-5', 'gpt-5-mini', 'o4-mini', 'gpt-4.1'],
    features: ['支持 Responses API', '支持 reasoning_effort', '适配 Codex / Cline'],
    warnings: [],
    enabled: true
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    badge: 'MiniMax',
    badgeColor: 'green',
    description: '国产高性价比，MiniMax M2 系列，支持 thinking 与 tool use',
    planType: 'payg',
    channel: 'minimax',
    serviceRate: 0.15,
    permissions: ['claude'],
    accountType: 'claude-console',
    targetGroupId: null, // 自动匹配账户分组
    models: [
      'MiniMax-M2.7',
      'MiniMax-M2.7-highspeed',
      'MiniMax-M2.5',
      'MiniMax-M2.5-highspeed',
      'MiniMax-M2.1',
      'MiniMax-M2'
    ],
    features: ['Anthropic 协议兼容', '204k 上下文', '支持 thinking', '支持 tool use'],
    warnings: [],
    enabled: true
  }
]

// 允许的充值金额（人民币）
const ALLOWED_RECHARGE_AMOUNTS = [10, 30, 50, 100, 200, 500]

class StoreService {
  constructor() {
    this.plansKey = 'store:plans'
    this.configKey = 'store:config'
    this.orderPrefix = 'store:order:'
    this.ordersIndex = 'store:orders:index'
    this.userOrdersPrefix = 'store:orders:user:'
  }

  // ─── 套餐管理 ────────────────────────────────────────────────

  // 读取存储的套餐 envelope，兼容旧数组格式
  // 返回 { version: <int>, plans: <Array> }
  async _readPlansEnvelope() {
    const data = await redis.get(this.plansKey)
    if (!data) {
      return { version: 0, plans: DEFAULT_PLANS }
    }
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return { version: 0, plans: parsed }
      }
      if (parsed && Array.isArray(parsed.plans)) {
        return {
          version: Number.isInteger(parsed.version) ? parsed.version : 0,
          plans: parsed.plans
        }
      }
      logger.warn('⚠️ store:plans 格式异常，回退到默认套餐')
      return { version: 0, plans: DEFAULT_PLANS }
    } catch (e) {
      logger.error('❌ store:plans JSON 解析失败，回退默认套餐:', e)
      return { version: 0, plans: DEFAULT_PLANS }
    }
  }

  async getPlans(onlyEnabled = true) {
    try {
      const { plans } = await this._readPlansEnvelope()

      // 自动匹配 targetGroupId：仅当 targetGroupId 为 null 或特殊值时自动解析
      const resolvedPlans = await Promise.all(
        plans.map(async (plan) => {
          if (plan.targetGroupId === null || plan.targetGroupId === undefined) {
            // 根据 channel 和 accountType 自动匹配账户分组
            const platform = this._getPlatformFromAccountType(plan.accountType)
            if (platform) {
              const groups = await accountGroupService.getAllGroups(platform)
              // 优先匹配名称包含 channel 的分组，否则取第一个
              const matchedGroup =
                groups.find((g) => g.name.toLowerCase().includes(plan.channel?.toLowerCase())) ||
                groups.find((g) => g.name.toLowerCase().includes(plan.id?.toLowerCase())) ||
                groups[0]

              if (matchedGroup) {
                logger.debug(
                  `📦 套餐 ${plan.id} 自动匹配分组: ${matchedGroup.name} (${matchedGroup.id})`
                )
                return { ...plan, targetGroupId: matchedGroup.id }
              }
            }
          }
          return plan
        })
      )

      return onlyEnabled ? resolvedPlans.filter((p) => p.enabled) : resolvedPlans
    } catch (error) {
      logger.error('❌ Error getting store plans:', error)
      throw error
    }
  }

  _getPlatformFromAccountType(accountType) {
    if (!accountType) {
      return null
    }
    if (accountType === 'claude-console' || accountType === 'claude') {
      return 'claude'
    }
    if (accountType === 'openai' || accountType === 'openai-responses') {
      return 'openai'
    }
    if (accountType === 'gemini') {
      return 'gemini'
    }
    if (accountType === 'droid') {
      return 'droid'
    }
    return null
  }

  // 兼容旧调用方（如 admin/orders.js 的 PUT /store/config）：直接覆盖并自增版本
  async savePlans(plans) {
    try {
      const { version } = await this._readPlansEnvelope()
      const envelope = { version: version + 1, plans }
      await redis.set(this.plansKey, JSON.stringify(envelope))
      return plans
    } catch (error) {
      logger.error('❌ Error saving store plans:', error)
      throw error
    }
  }

  // 管理端读取：返回全量套餐（含 disabled）+ 当前版本号
  async getPlansForAdmin() {
    try {
      return await this._readPlansEnvelope()
    } catch (error) {
      logger.error('❌ Error getting admin store plans:', error)
      throw error
    }
  }

  // 乐观锁保存：expectedVersion 必须等于当前 version；成功则版本 +1
  async savePlansWithVersion(plans, expectedVersion) {
    const { version: currentVersion } = await this._readPlansEnvelope()
    if (expectedVersion !== currentVersion) {
      const err = new Error('VERSION_CONFLICT')
      err.code = 'VERSION_CONFLICT'
      err.currentVersion = currentVersion
      throw err
    }
    const nextVersion = currentVersion + 1
    const envelope = { version: nextVersion, plans }
    await redis.set(this.plansKey, JSON.stringify(envelope))
    return { version: nextVersion, plans }
  }

  /**
   * 校验 plans 数组结构与引用完整性
   * @param {Array} plans
   * @param {object} ctx
   * @param {Set<string>} ctx.knownModels  已知模型 id 集合
   * @param {Set<string>} ctx.knownGroupIds 已知 accountGroup id 集合
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validatePlans(plans, _opts = {}) {
    const errors = []
    if (!Array.isArray(plans)) {
      return { valid: false, errors: ['plans 必须为数组'] }
    }

    const allowedChannels = new Set(['claude-code', 'codex', 'minimax'])
    const seenIds = new Set()

    plans.forEach((plan, idx) => {
      const tag = `plans[${idx}]`
      if (!plan || typeof plan !== 'object') {
        errors.push(`${tag} 必须为对象`)
        return
      }
      if (!plan.id || typeof plan.id !== 'string') {
        errors.push(`${tag}.id 必填且为字符串`)
      } else if (seenIds.has(plan.id)) {
        errors.push(`${tag}.id 重复: ${plan.id}`)
      } else {
        seenIds.add(plan.id)
      }
      if (!plan.name || typeof plan.name !== 'string') {
        errors.push(`${tag}.name 必填`)
      }
      if (!allowedChannels.has(plan.channel)) {
        errors.push(`${tag}.channel 必须为 claude-code/codex/minimax 之一`)
      }
      if (!plan.accountType || typeof plan.accountType !== 'string') {
        errors.push(`${tag}.accountType 必填`)
      }
      if (!Array.isArray(plan.permissions) || plan.permissions.length === 0) {
        errors.push(`${tag}.permissions 必填且为非空数组`)
      }
      if (!plan.targetGroupId || typeof plan.targetGroupId !== 'string') {
        errors.push(`${tag}.targetGroupId 必填`)
      }
      // 注：targetGroupId 校验移除，因为可能使用自定义字符串 ID 而非 UUID

      const numericFields = ['price', 'creditUSD', 'serviceRate', 'tokenLimit']
      numericFields.forEach((f) => {
        if (
          plan[f] !== undefined &&
          plan[f] !== null &&
          (typeof plan[f] !== 'number' || plan[f] < 0)
        ) {
          errors.push(`${tag}.${f} 必须为 ≥ 0 的数字`)
        }
      })

      if (!Array.isArray(plan.models)) {
        errors.push(`${tag}.models 必须为数组`)
      }
      // 注：models 校验移除，因为可能使用简短模型名或别名
    })

    return { valid: errors.length === 0, errors }
  }

  // ─── 商店配置（收款二维码等）──────────────────────────────────

  _defaultConfig() {
    return {
      qrCodeImage: null,
      paymentInstructions: '',
      rechargeAmounts: ALLOWED_RECHARGE_AMOUNTS
    }
  }

  async getConfig() {
    try {
      const data = await redis.get(this.configKey)
      const parsed = data ? JSON.parse(data) : null
      if (!parsed) {
        return this._defaultConfig()
      }
      return {
        ...this._defaultConfig(),
        ...parsed
      }
    } catch (error) {
      logger.error('❌ Error getting store config:', error)
      return this._defaultConfig()
    }
  }

  async saveConfig(config) {
    try {
      await redis.set(this.configKey, JSON.stringify(config))
      return config
    } catch (error) {
      logger.error('❌ Error saving store config:', error)
      throw error
    }
  }

  // ─── 订单管理 ────────────────────────────────────────────────

  generateOrderId() {
    return crypto.randomBytes(12).toString('hex')
  }

  /**
   * 创建订单
   * @param {object} params
   * @param {string} params.planId
   * @param {string} params.planName
   * @param {string} params.channel       - 渠道标识，如 'claude-max'
   * @param {string} params.badge         - 渠道标签，如 'Claude' / 'Codex'
   * @param {number} params.serviceRate   - 倍率，如 2.1
   * @param {number} params.amount        - 充值金额（人民币）
   * @param {number} params.creditUSD     - 对应 USD 额度
   * @param {string} params.currency      - 货币，默认 'CNY'
   * @param {string[]} params.permissions - 权限列表，如 ['claude']
   * @param {string} params.accountType   - 后端账号类型，如 'claude-console'
   * @param {string|null} params.targetGroupId - 目标账户分组ID
   * @param {string|null} params.userId
   * @param {string|null} params.contactInfo
   */
  async createOrder({
    planId,
    planName,
    channel,
    badge,
    serviceRate,
    amount,
    creditUSD,
    currency = 'CNY',
    permissions = [],
    accountType,
    targetGroupId = null,
    userId,
    contactInfo,
    // 兼容旧字段
    tokenLimit,
    price
  }) {
    try {
      const orderId = this.generateOrderId()
      const now = new Date().toISOString()
      const order = {
        orderId,
        planId,
        planName,
        channel: channel || null,
        badge: badge || null,
        serviceRate: serviceRate !== undefined && serviceRate !== null ? serviceRate : null,
        amount:
          amount !== undefined && amount !== null
            ? Number(amount)
            : price !== undefined && price !== null
              ? Number(price)
              : null,
        creditUSD: creditUSD !== undefined && creditUSD !== null ? Number(creditUSD) : null,
        currency,
        permissions: permissions || [],
        accountType: accountType || null,
        targetGroupId: targetGroupId || null,
        // 兼容旧 tokenLimit 字段
        tokenLimit: tokenLimit !== undefined && tokenLimit !== null ? tokenLimit : null,
        userId: userId || null,
        contactInfo: contactInfo || null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        apiKeyId: null,
        apiKeyValue: null,
        rejectReason: null
      }
      await redis.set(`${this.orderPrefix}${orderId}`, JSON.stringify(order))
      await redis.addToIndex(this.ordersIndex, orderId)
      if (userId) {
        await redis.addToIndex(`${this.userOrdersPrefix}${userId}`, orderId)
      }
      logger.info(
        `🛒 New order created: ${orderId} by user ${userId || 'anonymous'}, plan: ${planName}, amount: ¥${amount}, creditUSD: $${creditUSD}`
      )
      return order
    } catch (error) {
      logger.error('❌ Error creating order:', error)
      throw error
    }
  }

  async getOrder(orderId) {
    try {
      const data = await redis.get(`${this.orderPrefix}${orderId}`)
      if (!data) {
        return null
      }
      const order = JSON.parse(data)
      // 仅在 approved 状态下暴露 apiKeyValue
      if (order.status !== 'approved') {
        delete order.apiKeyValue
      }
      return order
    } catch (error) {
      logger.error('❌ Error getting order:', error)
      throw error
    }
  }

  async getOrderRaw(orderId) {
    try {
      const data = await redis.get(`${this.orderPrefix}${orderId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('❌ Error getting raw order:', error)
      throw error
    }
  }

  async updateOrderNote(orderId, note) {
    try {
      const order = await this.getOrderRaw(orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }
      order.note = note
      order.updatedAt = new Date().toISOString()
      await redis.set(`${this.orderPrefix}${orderId}`, JSON.stringify(order))
      logger.info(`📝 Order note updated: ${orderId}`)
      return order
    } catch (error) {
      logger.error('❌ Error updating order note:', error)
      throw error
    }
  }

  async _getIndexMembers(indexKey) {
    const client = redis.getClientSafe()
    return client.smembers(indexKey)
  }

  async getUserOrders(userId) {
    try {
      const orderIds = await this._getIndexMembers(`${this.userOrdersPrefix}${userId}`)
      if (!orderIds || orderIds.length === 0) {
        return []
      }
      const orders = await Promise.all(orderIds.map((id) => this.getOrder(id)))
      return orders
        .filter(Boolean)
        .filter((o) => !o.deletedByUser)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      logger.error('❌ Error getting user orders:', error)
      throw error
    }
  }

  // 用户主动删除订单（软删除）。
  // - pending  → 标记 cancelled
  // - rejected → 仅打 deletedByUser
  // - approved → 通过阈值校验后禁用关联 API Key 并打 deletedByUser
  async deleteUserOrder(userId, orderId) {
    const order = await this.getOrderRaw(orderId)
    if (!order || order.userId !== userId) {
      throw new Error('ORDER_NOT_FOUND')
    }
    if (order.deletedByUser) {
      throw new Error('ORDER_ALREADY_DELETED')
    }

    const sideEffects = { apiKeyDisabled: false }

    if (order.status === 'approved') {
      const approvedAt = order.updatedAt || order.createdAt
      const ageMs = Date.now() - new Date(approvedAt).getTime()
      if (ageMs > 30 * 24 * 60 * 60 * 1000) {
        throw new Error('ORDER_TOO_OLD')
      }

      // 用量阈值：仅在 totalCostLimit > 0 时检查
      if (order.apiKeyId) {
        try {
          const apiKeyService = require('./apiKeyService')
          const keyInfo = await apiKeyService.getApiKeyById(order.apiKeyId)
          const limit = keyInfo ? Number(keyInfo.totalCostLimit) || 0 : 0
          if (limit > 0) {
            const stats = await apiKeyService.getUsageStats(order.apiKeyId, {
              includeRecords: false
            })
            const totalCost = Number(stats?.total?.cost) || 0
            if (totalCost / limit > 0.5) {
              throw new Error('ORDER_USAGE_TOO_HIGH')
            }
          }

          // 副作用：禁用 Key（任何失败都不写订单）
          await apiKeyService.updateApiKey(order.apiKeyId, {
            isActive: false,
            disabledReason: 'order_deleted_by_user'
          })
          sideEffects.apiKeyDisabled = true
        } catch (err) {
          if (err.message === 'ORDER_USAGE_TOO_HIGH') {
            throw err
          }
          logger.error('❌ Failed to disable API key during order deletion:', err)
          throw new Error('API_KEY_DISABLE_FAILED')
        }
      }
    } else if (order.status !== 'pending' && order.status !== 'rejected') {
      throw new Error('ORDER_NOT_DELETABLE')
    }

    const prevStatus = order.status
    const now = new Date().toISOString()
    if (order.status === 'pending') {
      order.status = 'cancelled'
    }
    order.deletedByUser = true
    order.deletedAt = now
    order.updatedAt = now
    await redis.set(`${this.orderPrefix}${orderId}`, JSON.stringify(order))
    logger.info(
      `🗑️  User-deleted order: ${orderId}, prevStatus=${prevStatus}, apiKeyDisabled=${sideEffects.apiKeyDisabled}, userId=${userId}`
    )
    return { order, sideEffects }
  }

  async getAllOrders({ status, limit = 50, offset = 0 } = {}) {
    try {
      const orderIds = await this._getIndexMembers(this.ordersIndex)
      if (!orderIds || orderIds.length === 0) {
        return { orders: [], total: 0 }
      }
      const allOrders = (await Promise.all(orderIds.map((id) => this.getOrderRaw(id)))).filter(
        Boolean
      )
      const filtered = status ? allOrders.filter((o) => o.status === status) : allOrders
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      return {
        orders: filtered.slice(offset, offset + limit),
        total: filtered.length
      }
    } catch (error) {
      logger.error('❌ Error getting all orders:', error)
      throw error
    }
  }

  async approveOrder(orderId, { apiKeyId, apiKeyValue }) {
    try {
      const order = await this.getOrderRaw(orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }
      if (order.status !== 'pending') {
        throw new Error('ORDER_NOT_PENDING')
      }
      order.status = 'approved'
      order.apiKeyId = apiKeyId
      order.apiKeyValue = apiKeyValue
      order.updatedAt = new Date().toISOString()
      await redis.set(`${this.orderPrefix}${orderId}`, JSON.stringify(order))
      logger.info(`✅ Order approved: ${orderId}`)
      return order
    } catch (error) {
      logger.error('❌ Error approving order:', error)
      throw error
    }
  }

  async rejectOrder(orderId, rejectReason = '') {
    try {
      const order = await this.getOrderRaw(orderId)
      if (!order) {
        throw new Error('ORDER_NOT_FOUND')
      }
      if (order.status !== 'pending') {
        throw new Error('ORDER_NOT_PENDING')
      }
      order.status = 'rejected'
      order.rejectReason = rejectReason
      order.updatedAt = new Date().toISOString()
      await redis.set(`${this.orderPrefix}${orderId}`, JSON.stringify(order))
      logger.info(`❌ Order rejected: ${orderId}, reason: ${rejectReason}`)
      return order
    } catch (error) {
      logger.error('❌ Error rejecting order:', error)
      throw error
    }
  }

  // 暴露允许的充值金额供路由层校验
  getAllowedRechargeAmounts() {
    return ALLOWED_RECHARGE_AMOUNTS
  }
}

module.exports = new StoreService()
