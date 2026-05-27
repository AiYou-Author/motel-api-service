const express = require('express')
const router = express.Router()
const referralService = require('../services/referralService')
const { authenticateUser } = require('../middleware/auth')
const logger = require('../utils/logger')

// GET /referral/info - 获取当前用户推广信息
router.get('/info', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id
    const [code, invitedIds, balance, config] = await Promise.all([
      referralService.getOrCreateReferralCode(userId),
      referralService.getInvitedUserIds(userId),
      referralService.getWalletBalance(userId),
      referralService.getCommissionConfig()
    ])
    res.json({
      code,
      invitedCount: invitedIds.length,
      balance,
      commissionRate: config.enabled ? config.globalRate : 0,
      enabled: config.enabled
    })
  } catch (error) {
    logger.error('❌ Error getting referral info:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /referral/records - 获取佣金流水记录
router.get('/records', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = parseInt(req.query.offset) || 0
    const { total, records } = await referralService.getCommissionRecords({ userId, limit, offset })
    res.json({ total, records })
  } catch (error) {
    logger.error('❌ Error getting commission records:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /referral/withdrawals - 获取用户提现记录
router.get('/withdrawals', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = parseInt(req.query.offset) || 0
    const { total, requests } = await referralService.getWithdrawRequests({ userId, limit, offset })
    res.json({ total, requests })
  } catch (error) {
    logger.error('❌ Error getting withdrawal requests:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /referral/withdraw - 申请提现
router.post('/withdraw', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id
    const { amount, method, accountInfo, note } = req.body

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'INVALID_AMOUNT', message: '提现金额无效' })
    }
    if (!method) {
      return res.status(400).json({ error: 'METHOD_REQUIRED', message: '请选择收款方式' })
    }
    if (!accountInfo) {
      return res.status(400).json({ error: 'ACCOUNT_REQUIRED', message: '请填写收款账号' })
    }

    const config = await referralService.getCommissionConfig()
    if (!config.enabled) {
      return res.status(403).json({ error: 'FEATURE_DISABLED', message: '推广返佣功能未开启' })
    }

    const request = await referralService.createWithdrawRequest(userId, {
      amount: parseFloat(amount),
      method,
      accountInfo,
      note: note || ''
    })
    res.status(201).json({ success: true, request })
  } catch (error) {
    const errorMap = {
      INSUFFICIENT_BALANCE: { code: 400, message: '佣金余额不足' },
      INVALID_AMOUNT: { code: 400, message: '提现金额无效' }
    }
    const hit = errorMap[error.message]
    if (hit) {
      return res.status(hit.code).json({ error: error.message, message: hit.message })
    }
    logger.error('❌ Error creating withdrawal request:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
