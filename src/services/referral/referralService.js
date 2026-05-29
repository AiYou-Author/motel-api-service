const redis = require('../../models/redis')
const crypto = require('crypto')
const logger = require('../../utils/logger')

const COMMISSION_CONFIG_KEY = 'commission:config'
const WALLET_PREFIX = 'wallet:balance:'
const COMMISSION_RECORD_PREFIX = 'commission:record:'
const COMMISSION_RECORDS_INDEX = 'commission:records:index'
const COMMISSION_RECORDS_USER_PREFIX = 'commission:records:user:'
const WITHDRAW_REQUEST_PREFIX = 'withdraw:request:'
const WITHDRAW_REQUESTS_INDEX = 'withdraw:requests:index'
const WITHDRAW_REQUESTS_USER_PREFIX = 'withdraw:requests:user:'
const REFERRAL_CODE_PREFIX = 'referral:code:'
const REFERRAL_USER_PREFIX = 'referral:user:'
const REFERRAL_INVITED_BY_PREFIX = 'referral:invitedby:'
const REFERRAL_INVITES_PREFIX = 'referral:invites:'

class ReferralService {
  // ─── 推广码管理 ────────────────────────────────────────────────

  generateCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase()
  }

  generateId() {
    return crypto.randomBytes(8).toString('hex')
  }

  // 获取或生成用户推广码
  async getOrCreateReferralCode(userId) {
    try {
      const existing = await redis.get(`${REFERRAL_USER_PREFIX}${userId}`)

      if (existing) {
        return existing
      }
      // 生成唯一推广码，避免碰撞
      let code

      for (let i = 0; i < 10; i++) {
        const candidate = this.generateCode()
        const taken = await redis.get(`${REFERRAL_CODE_PREFIX}${candidate}`)

        if (!taken) {
          code = candidate
          break
        }
      }
      if (!code) {
        throw new Error('FAILED_TO_GENERATE_CODE')
      }
      await redis.set(`${REFERRAL_CODE_PREFIX}${code}`, userId)
      await redis.set(`${REFERRAL_USER_PREFIX}${userId}`, code)
      logger.info(`🔗 Referral code generated for user ${userId}: ${code}`)

      return code
    } catch (error) {
      logger.error('❌ Error generating referral code:', error)
      throw error
    }
  }

  // 通过推广码查找推荐人 userId
  async getReferrerByCode(code) {
    if (!code) {
      return null
    }
    try {
      return await redis.get(`${REFERRAL_CODE_PREFIX}${code.toUpperCase()}`)
    } catch (error) {
      logger.error('❌ Error looking up referral code:', error)

      return null
    }
  }

  // 通过 userId 获取推广码
  async getCodeByUserId(userId) {
    try {
      return await redis.get(`${REFERRAL_USER_PREFIX}${userId}`)
    } catch (error) {
      logger.error('❌ Error getting referral code by userId:', error)

      return null
    }
  }

  // 绑定推荐关系（注册时调用）
  async bindReferral(newUserId, referrerId) {
    if (!newUserId || !referrerId || newUserId === referrerId) {
      return
    }
    try {
      // 防止重复绑定
      const existing = await redis.get(`${REFERRAL_INVITED_BY_PREFIX}${newUserId}`)

      if (existing) {
        return
      }

      await redis.set(`${REFERRAL_INVITED_BY_PREFIX}${newUserId}`, referrerId)
      await redis.addToIndex(`${REFERRAL_INVITES_PREFIX}${referrerId}`, newUserId)
      logger.info(`🤝 Referral bound: user ${newUserId} invited by ${referrerId}`)
    } catch (error) {
      logger.error('❌ Error binding referral:', error)
    }
  }

  // 获取被谁邀请
  async getReferredBy(userId) {
    try {
      return await redis.get(`${REFERRAL_INVITED_BY_PREFIX}${userId}`)
    } catch (error) {
      return null
    }
  }

  // 获取推广人邀请的所有用户 id 列表
  async getInvitedUserIds(referrerId) {
    try {
      const client = redis.getClientSafe()
      const ids = await client.smembers(`${REFERRAL_INVITES_PREFIX}${referrerId}`)

      return ids || []
    } catch (error) {
      logger.error('❌ Error getting invited users:', error)

      return []
    }
  }

  // ─── 佣金配置 ─────────────────────────────────────────────────

  async getCommissionConfig() {
    try {
      const data = await redis.get(COMMISSION_CONFIG_KEY)

      if (data) {
        return JSON.parse(data)
      }

      // 默认配置
      return {
        enabled: false,
        globalRate: 0.1, // 10% 全局默认返佣比例
        planRates: {} // planId → rate，优先级高于 globalRate
      }
    } catch (error) {
      logger.error('❌ Error getting commission config:', error)

      return { enabled: false, globalRate: 0.1, planRates: {} }
    }
  }

  async saveCommissionConfig(config) {
    try {
      const current = await this.getCommissionConfig()
      const merged = {
        ...current,
        ...config,
        planRates: { ...(current.planRates || {}), ...(config.planRates || {}) }
      }

      await redis.set(COMMISSION_CONFIG_KEY, JSON.stringify(merged))
      logger.info('⚙️ Commission config updated')

      return merged
    } catch (error) {
      logger.error('❌ Error saving commission config:', error)
      throw error
    }
  }

  // 获取某套餐的返佣比例（plan 级别 > 全局）
  async getCommissionRate(planId) {
    const config = await this.getCommissionConfig()

    if (!config.enabled) {
      return 0
    }
    if (planId && config.planRates && config.planRates[planId] !== undefined) {
      return Number(config.planRates[planId])
    }

    return Number(config.globalRate) || 0
  }

  // ─── 钱包 ──────────────────────────────────────────────────────

  async getWalletBalance(userId) {
    try {
      const val = await redis.get(`${WALLET_PREFIX}${userId}`)

      return val ? parseFloat(val) : 0
    } catch (error) {
      logger.error('❌ Error getting wallet balance:', error)

      return 0
    }
  }

  async _setWalletBalance(userId, amount) {
    await redis.set(`${WALLET_PREFIX}${userId}`, amount.toFixed(4))
  }

  // 增加余额，并记录佣金流水
  async creditWallet(
    userId,
    amount,
    { type = 'commission', orderId = null, fromUserId = null, note = '' } = {}
  ) {
    try {
      const current = await this.getWalletBalance(userId)
      const newBalance = parseFloat((current + amount).toFixed(4))

      await this._setWalletBalance(userId, newBalance)

      const record = {
        id: this.generateId(),
        userId,
        type, // 'commission' | 'refund' | 'admin_credit'
        direction: 'credit',
        amount: parseFloat(amount.toFixed(4)),
        balanceAfter: newBalance,
        orderId: orderId || null,
        fromUserId: fromUserId || null,
        note,
        createdAt: new Date().toISOString()
      }

      await redis.set(`${COMMISSION_RECORD_PREFIX}${record.id}`, JSON.stringify(record))
      await redis.addToIndex(COMMISSION_RECORDS_INDEX, record.id)
      await redis.addToIndex(`${COMMISSION_RECORDS_USER_PREFIX}${userId}`, record.id)

      logger.info(`💰 Wallet credited: user ${userId} +¥${amount} (balance: ¥${newBalance})`)

      return { balance: newBalance, record }
    } catch (error) {
      logger.error('❌ Error crediting wallet:', error)
      throw error
    }
  }

  // 扣减余额
  async debitWallet(userId, amount, { type = 'purchase', orderId = null, note = '' } = {}) {
    try {
      const current = await this.getWalletBalance(userId)

      if (current < amount) {
        throw new Error('INSUFFICIENT_BALANCE')
      }
      const newBalance = parseFloat((current - amount).toFixed(4))

      await this._setWalletBalance(userId, newBalance)

      const record = {
        id: this.generateId(),
        userId,
        type,
        direction: 'debit',
        amount: parseFloat(amount.toFixed(4)),
        balanceAfter: newBalance,
        orderId: orderId || null,
        note,
        createdAt: new Date().toISOString()
      }

      await redis.set(`${COMMISSION_RECORD_PREFIX}${record.id}`, JSON.stringify(record))
      await redis.addToIndex(COMMISSION_RECORDS_INDEX, record.id)
      await redis.addToIndex(`${COMMISSION_RECORDS_USER_PREFIX}${userId}`, record.id)

      logger.info(`💸 Wallet debited: user ${userId} -¥${amount} (balance: ¥${newBalance})`)

      return { balance: newBalance, record }
    } catch (error) {
      logger.error('❌ Error debiting wallet:', error)
      throw error
    }
  }

  // ─── 返佣处理（订单审批后调用）────────────────────────────────

  async processOrderCommission(order) {
    if (!order || !order.userId) {
      return
    }
    try {
      const referrerId = await this.getReferredBy(order.userId)

      if (!referrerId) {
        return
      }

      const rate = await this.getCommissionRate(order.planId)

      if (!rate || rate <= 0) {
        return
      }

      const orderAmount = parseFloat(order.amount) || 0

      if (orderAmount <= 0) {
        return
      }

      const commission = parseFloat((orderAmount * rate).toFixed(4))

      if (commission <= 0) {
        return
      }

      await this.creditWallet(referrerId, commission, {
        type: 'commission',
        orderId: order.orderId,
        fromUserId: order.userId,
        note: `订单 ${order.orderId} 返佣 (${(rate * 100).toFixed(0)}%)`
      })

      logger.info(
        `🎁 Commission processed: referrer ${referrerId} earned ¥${commission} from order ${order.orderId} (rate: ${rate * 100}%)`
      )
    } catch (error) {
      // 返佣失败不影响订单主流程，只记录日志
      logger.error('❌ Error processing order commission:', error)
    }
  }

  // ─── 佣金流水查询 ──────────────────────────────────────────────

  async getCommissionRecords({ userId = null, limit = 50, offset = 0 } = {}) {
    try {
      const client = redis.getClientSafe()
      let ids

      if (userId) {
        ids = await client.smembers(`${COMMISSION_RECORDS_USER_PREFIX}${userId}`)
      } else {
        ids = await client.smembers(COMMISSION_RECORDS_INDEX)
      }
      if (!ids || ids.length === 0) {
        return { total: 0, records: [] }
      }

      const records = await Promise.all(
        ids.map(async (id) => {
          const data = await redis.get(`${COMMISSION_RECORD_PREFIX}${id}`)

          return data ? JSON.parse(data) : null
        })
      )
      const sorted = records
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return {
        total: sorted.length,
        records: sorted.slice(offset, offset + limit)
      }
    } catch (error) {
      logger.error('❌ Error getting commission records:', error)

      return { total: 0, records: [] }
    }
  }

  // ─── 提现申请 ──────────────────────────────────────────────────

  async createWithdrawRequest(userId, { amount, method, accountInfo, note = '' }) {
    try {
      const balance = await this.getWalletBalance(userId)

      if (balance < amount) {
        throw new Error('INSUFFICIENT_BALANCE')
      }
      if (amount <= 0) {
        throw new Error('INVALID_AMOUNT')
      }

      const id = this.generateId()
      const request = {
        id,
        userId,
        amount: parseFloat(amount.toFixed(4)),
        method, // 'alipay' | 'wechat' | 'bank'
        accountInfo, // 账号信息
        note,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminNote: null
      }

      // 冻结金额（立即扣减，拒绝时退回）
      await this.debitWallet(userId, amount, {
        type: 'withdraw',
        note: `提现申请 ${id}`
      })

      await redis.set(`${WITHDRAW_REQUEST_PREFIX}${id}`, JSON.stringify(request))
      await redis.addToIndex(WITHDRAW_REQUESTS_INDEX, id)
      await redis.addToIndex(`${WITHDRAW_REQUESTS_USER_PREFIX}${userId}`, id)

      logger.info(`💳 Withdraw request created: ${id} by user ${userId}, amount: ¥${amount}`)

      return request
    } catch (error) {
      logger.error('❌ Error creating withdraw request:', error)
      throw error
    }
  }

  async getWithdrawRequest(id) {
    try {
      const data = await redis.get(`${WITHDRAW_REQUEST_PREFIX}${id}`)

      return data ? JSON.parse(data) : null
    } catch (error) {
      return null
    }
  }

  async getWithdrawRequests({ userId = null, status = null, limit = 50, offset = 0 } = {}) {
    try {
      const client = redis.getClientSafe()
      let ids

      if (userId) {
        ids = await client.smembers(`${WITHDRAW_REQUESTS_USER_PREFIX}${userId}`)
      } else {
        ids = await client.smembers(WITHDRAW_REQUESTS_INDEX)
      }
      if (!ids || ids.length === 0) {
        return { total: 0, requests: [] }
      }

      const requests = await Promise.all(
        ids.map(async (id) => {
          const data = await redis.get(`${WITHDRAW_REQUEST_PREFIX}${id}`)

          return data ? JSON.parse(data) : null
        })
      )

      let filtered = requests.filter(Boolean)

      if (status) {
        filtered = filtered.filter((r) => r.status === status)
      }
      const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      return {
        total: sorted.length,
        requests: sorted.slice(offset, offset + limit)
      }
    } catch (error) {
      logger.error('❌ Error getting withdraw requests:', error)

      return { total: 0, requests: [] }
    }
  }

  async approveWithdrawRequest(id, { adminNote = '' } = {}) {
    try {
      const request = await this.getWithdrawRequest(id)

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND')
      }
      if (request.status !== 'pending') {
        throw new Error('REQUEST_NOT_PENDING')
      }

      request.status = 'approved'
      request.adminNote = adminNote
      request.updatedAt = new Date().toISOString()
      await redis.set(`${WITHDRAW_REQUEST_PREFIX}${id}`, JSON.stringify(request))

      logger.info(`✅ Withdraw request approved: ${id}`)

      return request
    } catch (error) {
      logger.error('❌ Error approving withdraw request:', error)
      throw error
    }
  }

  async rejectWithdrawRequest(id, { reason = '' } = {}) {
    try {
      const request = await this.getWithdrawRequest(id)

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND')
      }
      if (request.status !== 'pending') {
        throw new Error('REQUEST_NOT_PENDING')
      }

      // 退回已冻结金额
      await this.creditWallet(request.userId, request.amount, {
        type: 'refund',
        note: `提现申请 ${id} 被拒绝，金额退回`
      })

      request.status = 'rejected'
      request.adminNote = reason
      request.updatedAt = new Date().toISOString()
      await redis.set(`${WITHDRAW_REQUEST_PREFIX}${id}`, JSON.stringify(request))

      logger.info(`❌ Withdraw request rejected: ${id}, amount refunded to user ${request.userId}`)

      return request
    } catch (error) {
      logger.error('❌ Error rejecting withdraw request:', error)
      throw error
    }
  }

  // ─── 统计信息 ──────────────────────────────────────────────────

  async getReferralStats(userId) {
    try {
      const code = await this.getCodeByUserId(userId)
      const invitedIds = await this.getInvitedUserIds(userId)
      const balance = await this.getWalletBalance(userId)
      const { total: totalRecords, records } = await this.getCommissionRecords({
        userId,
        limit: 1000
      })
      const totalCommission = records
        .filter((r) => r.direction === 'credit' && r.type === 'commission')
        .reduce((sum, r) => sum + r.amount, 0)

      return {
        code,
        invitedCount: invitedIds.length,
        balance: parseFloat(balance.toFixed(4)),
        totalCommission: parseFloat(totalCommission.toFixed(4)),
        totalRecords
      }
    } catch (error) {
      logger.error('❌ Error getting referral stats:', error)

      return { code: null, invitedCount: 0, balance: 0, totalCommission: 0, totalRecords: 0 }
    }
  }

  // 管理端总览统计
  async getAdminStats() {
    try {
      const client = redis.getClientSafe()
      const recordIds = await client.smembers(COMMISSION_RECORDS_INDEX)
      const records = await Promise.all(
        (recordIds || []).map(async (id) => {
          const data = await redis.get(`${COMMISSION_RECORD_PREFIX}${id}`)

          return data ? JSON.parse(data) : null
        })
      )
      const validRecords = records.filter(Boolean)
      const totalPaid = validRecords
        .filter((r) => r.direction === 'credit' && r.type === 'commission')
        .reduce((s, r) => s + r.amount, 0)

      const requestIds = await client.smembers(WITHDRAW_REQUESTS_INDEX)
      const requests = await Promise.all(
        (requestIds || []).map(async (id) => {
          const data = await redis.get(`${WITHDRAW_REQUEST_PREFIX}${id}`)

          return data ? JSON.parse(data) : null
        })
      )
      const validRequests = requests.filter(Boolean)
      const pendingWithdraw = validRequests
        .filter((r) => r.status === 'pending')
        .reduce((s, r) => s + r.amount, 0)

      return {
        totalCommissionPaid: parseFloat(totalPaid.toFixed(4)),
        pendingWithdrawAmount: parseFloat(pendingWithdraw.toFixed(4)),
        totalWithdrawRequests: validRequests.length,
        pendingWithdrawCount: validRequests.filter((r) => r.status === 'pending').length
      }
    } catch (error) {
      logger.error('❌ Error getting admin stats:', error)

      return {}
    }
  }
}

module.exports = new ReferralService()
