const express = require('express')
const { authenticateAdmin } = require('../../middleware/auth')
const logger = require('../../utils/logger')

function sendError(res, status, message, details) {
  return res.status(status).json({ error: message, message: details })
}

function sendSuccess(res, data) {
  return res.json({ success: true, data })
}

/**
 * Create standard CRUD routes for account-type resources.
 *
 * @param {Object} opts
 * @param {string} opts.resourcePath - Route prefix (e.g., '/api/admin/bedrock-accounts')
 * @param {Object} opts.service - Service instance with CRUD methods
 * @param {string} [opts.getAllMethod] - Method name for listing (default: 'getAllAccounts')
 * @param {string} [opts.getMethod] - Method name for single get (default: 'getAccount')
 * @param {string} [opts.createMethod] - Method name for create (default: 'createAccount')
 * @param {string} [opts.updateMethod] - Method name for update (default: 'updateAccount')
 * @param {string} [opts.deleteMethod] - Method name for delete (default: 'deleteAccount')
 * @param {boolean} [opts.listReturnsWrapped] - Whether getAll returns {success, data} (default: false)
 * @param {Object} [opts.customHooks] - { afterList, afterGet, afterCreate, afterUpdate }
 */
function createCrudRoutes(opts = {}) {
  const {
    resourcePath,
    service,
    getAllMethod = 'getAllAccounts',
    getMethod = 'getAccount',
    createMethod = 'createAccount',
    updateMethod = 'updateAccount',
    deleteMethod = 'deleteAccount',
    listReturnsWrapped = false,
    customHooks = {}
  } = opts

  const router = express.Router()

  // GET / — List all
  router.get(resourcePath || '/', authenticateAdmin, async (req, res) => {
    try {
      const result = await service[getAllMethod]()

      let accounts = listReturnsWrapped ? (result.success ? result.data : []) : result

      if (customHooks.afterList) {
        accounts = await customHooks.afterList(accounts, req)
      }

      return sendSuccess(res, accounts)
    } catch (error) {
      logger.error(`Error listing accounts for ${resourcePath}:`, error.message)

      return sendError(res, 500, 'Failed to list accounts', error.message)
    }
  })

  // GET /:id — Get by ID
  router.get(`${resourcePath}/:id`, authenticateAdmin, async (req, res) => {
    try {
      const account = await service[getMethod](req.params.id)

      if (!account) {
        return sendError(res, 404, 'Account not found')
      }

      if (customHooks.afterGet) {
        return sendSuccess(res, await customHooks.afterGet(account, req))
      }

      return sendSuccess(res, account)
    } catch (error) {
      logger.error(`Error getting account ${req.params.id}:`, error.message)

      return sendError(res, 500, 'Failed to get account', error.message)
    }
  })

  // POST / — Create
  router.post(resourcePath || '/', authenticateAdmin, async (req, res) => {
    try {
      const account = await service[createMethod](req.body)

      if (customHooks.afterCreate) {
        await customHooks.afterCreate(account, req)
      }

      return res.status(201).json({ success: true, data: account })
    } catch (error) {
      logger.error(`Error creating account for ${resourcePath}:`, error.message)

      return sendError(res, 400, 'Failed to create account', error.message)
    }
  })

  // PUT /:id — Update
  router.put(`${resourcePath}/:id`, authenticateAdmin, async (req, res) => {
    try {
      const account = await service[updateMethod](req.params.id, req.body)

      if (customHooks.afterUpdate) {
        await customHooks.afterUpdate(account, req)
      }

      return sendSuccess(res, account)
    } catch (error) {
      logger.error(`Error updating account ${req.params.id}:`, error.message)

      return sendError(res, 400, 'Failed to update account', error.message)
    }
  })

  // DELETE /:id — Delete
  router.delete(`${resourcePath}/:id`, authenticateAdmin, async (req, res) => {
    try {
      await service[deleteMethod](req.params.id)

      return sendSuccess(res, { deleted: true })
    } catch (error) {
      logger.error(`Error deleting account ${req.params.id}:`, error.message)

      return sendError(res, 500, 'Failed to delete account', error.message)
    }
  })

  return router
}

module.exports = { createCrudRoutes, sendError, sendSuccess }
