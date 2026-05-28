const express = require('express')
const router = express.Router()
const referralService = require('../../services/referralService')
const { authenticateAdmin } = require('../../middleware/auth')
const logger = require('../../utils/logger')

// GET /admin/referral/config
router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    const config = await referralService.getCommissionConfig()

    res.json(config)
  } catch (error) {
    logger.error('❌ Error getting referral config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /admin/referral/config
router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    const { enabled, globalRate, planRates } = req.body

    await referralService.saveCommissionConfig({ enabled, globalRate, planRates })
    res.json({ success: true })
  } catch (error) {
    logger.error('❌ Error updating referral config:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/referral/stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await referralService.getAdminStats()

    res.json(stats)
  } catch (error) {
    logger.error('❌ Error getting referral admin stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /admin/referral/withdrawals
router.get('/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const { userId, status, limit = 50, offset = 0 } = req.query
    const result = await referralService.getWithdrawRequests({
      userId: userId || null,
      status: status || null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json(result)
  } catch (error) {
    logger.error('❌ Error getting withdraw requests:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/referral/withdrawals/:id/approve
router.post('/withdrawals/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { adminNote = '' } = req.body
    const request = await referralService.approveWithdrawRequest(id, { adminNote })

    res.json({ success: true, request })
  } catch (error) {
    logger.error('❌ Error approving withdraw request:', error)
    if (error.message === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({ error: 'Withdraw request not found' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /admin/referral/withdrawals/:id/reject
router.post('/withdrawals/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { reason = '' } = req.body
    const request = await referralService.rejectWithdrawRequest(id, { reason })

    res.json({ success: true, request })
  } catch (error) {
    logger.error('❌ Error rejecting withdraw request:', error)
    if (error.message === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({ error: 'Withdraw request not found' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
