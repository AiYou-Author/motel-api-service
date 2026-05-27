const express = require('express')
const router = express.Router()
const storeService = require('../../services/storeService')
const { authenticateAdmin } = require('../../middleware/auth')
const logger = require('../../utils/logger')

// GET /admin/store/plans - 列出全部套餐（含 disabled）
router.get('/plans', authenticateAdmin, async (req, res) => {
  try {
    const { plans, version } = await storeService.getPlansForAdmin()
    res.json({ success: true, plans, version })
  } catch (error) {
    logger.error('❌ Error getting admin store plans:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /admin/store/plans - 全量替换（乐观锁）
router.put('/plans', authenticateAdmin, async (req, res) => {
  try {
    const { plans, expectedVersion } = req.body || {}
    if (!Array.isArray(plans)) {
      return res.status(400).json({ success: false, error: 'plans 必须为数组' })
    }
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return res.status(400).json({ success: false, error: 'expectedVersion 必须为 ≥ 0 的整数' })
    }

    // 基础校验（不再校验 targetGroupId 和 models 是否存在于系统中）
    const { valid, errors } = storeService.validatePlans(plans, {})
    if (!valid) {
      return res.status(400).json({ success: false, error: '校验失败', details: errors })
    }

    try {
      const saved = await storeService.savePlansWithVersion(plans, expectedVersion)
      return res.json({ success: true, plans: saved.plans, version: saved.version })
    } catch (e) {
      if (e && e.code === 'VERSION_CONFLICT') {
        return res.status(409).json({
          success: false,
          error: 'VERSION_CONFLICT',
          currentVersion: e.currentVersion
        })
      }
      throw e
    }
  } catch (error) {
    logger.error('❌ Error saving admin store plans:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

module.exports = router
