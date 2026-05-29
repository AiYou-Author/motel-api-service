const logger = require('../../utils/logger')

/**
 * 模型服务
 * 管理系统支持的 AI 模型列表
 * 与 pricingService 独立，专注于"支持哪些模型"而不是"如何计费"
 */
class ModelService {
  constructor() {
    this.supportedModels = this.getDefaultModels()
  }

  /**
   * 初始化模型服务
   */
  async initialize() {
    const totalModels = Object.values(this.supportedModels).reduce(
      (sum, config) => sum + config.models.length,
      0
    )

    logger.success(`Model service initialized with ${totalModels} models`)
  }

  /**
   * 获取支持的模型配置
   */
  getDefaultModels() {
    return {
      claude: {
        provider: 'anthropic',
        description: 'Claude models from Anthropic',
        models: [
          'claude-opus-4-5-20251101',
          'claude-haiku-4-5-20251001',
          'claude-sonnet-4-5-20250929',
          'claude-opus-4-1-20250805',
          'claude-sonnet-4-20250514',
          'claude-opus-4-20250514',
          'claude-3-7-sonnet-20250219',
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-haiku-20240307'
        ]
      },
      openai: {
        provider: 'openai',
        description: 'OpenAI GPT models',
        models: [
          'gpt-5.1-2025-11-13',
          'gpt-5.1-codex-mini',
          'gpt-5.1-codex',
          'gpt-5.1-codex-max',
          'gpt-5-2025-08-07',
          'gpt-5-codex',
          'gpt-5.3-codex',
          'gpt-5.3-codex-spark',
          'gpt-5.4',
          'gpt-5.4-pro'
        ]
      },
      gemini: {
        provider: 'google',
        description: 'Google Gemini models',
        models: [
          'gemini-2.5-pro',
          'gemini-3-pro-preview',
          'gemini-3.1-pro-preview',
          'gemini-2.5-flash'
        ]
      }
    }
  }

  /**
   * 获取所有支持的模型（OpenAI API 格式）
   * @param {object} [opts]
   * @param {boolean} [opts.includeCustom=true] 是否合并 pricingService.customPricing 中的自定义模型
   */
  getAllModels(opts = {}) {
    const { includeCustom = true } = opts
    const models = []
    const now = Math.floor(Date.now() / 1000)
    const seen = new Set()

    for (const [_service, config] of Object.entries(this.supportedModels)) {
      for (const modelId of config.models) {
        if (seen.has(modelId)) {
          continue
        }
        seen.add(modelId)
        models.push({
          id: modelId,
          object: 'model',
          created: now,
          owned_by: config.provider
        })
      }
    }

    if (includeCustom) {
      try {
        const pricingService = require('../billing/pricingService')
        const custom = pricingService.customPricing || {}

        for (const [modelId, info] of Object.entries(custom)) {
          if (seen.has(modelId)) {
            continue
          }
          seen.add(modelId)
          models.push({
            id: modelId,
            object: 'model',
            created: now,
            owned_by: (info && info.litellm_provider) || 'custom'
          })
        }
      } catch (e) {
        logger.warn('⚠️  modelService 合并自定义模型失败:', e.message)
      }
    }

    return models.sort((a, b) => {
      // 先按 provider 排序，再按 model id 排序
      if (a.owned_by !== b.owned_by) {
        return a.owned_by.localeCompare(b.owned_by)
      }

      return a.id.localeCompare(b.id)
    })
  }

  /**
   * 根据 API Key 绑定的账号 / 账号组，解析其可访问的模型 ID 集合。
   * 返回 null 表示没有特定限制（即应回退到全量列表）。
   *
   * 解析规则：
   *  - 若 apiKey.claudeConsoleAccountId 指向具体的 claude-console 账号 → 取该账号 supportedModels
   *  - 若 apiKey.claudeAccountId 形如 "group:<id>" → 取该分组下所有 claude-console 成员 supportedModels 的并集
   *  - 任一目标账号 supportedModels 为空数组 → 视为"该账号支持所有模型" → 回退 null
   *  - 没有任何 claude-console 绑定 → 回退 null
   *
   * @param {object} apiKey
   * @returns {Promise<Set<string>|null>}
   */
  async resolveAllowedModelsForApiKey(apiKey) {
    if (!apiKey) {
      return null
    }

    const claudeConsoleAccountService = require('../account/claudeConsole/ClaudeConsoleAccountService')
    const accountGroupService = require('../accountGroupService')

    const collectFromAccount = async (accountId) => {
      try {
        const acc = await claudeConsoleAccountService.getAccount(accountId)

        if (!acc) {
          return { unrestricted: false, models: [] }
        }
        const sm = acc.supportedModels
        let list = []

        // 支持多种格式：数组、JSON 字符串（数组或对象）、逗号/空格分隔字符串
        if (Array.isArray(sm)) {
          list = sm
        } else if (typeof sm === 'string' && sm.trim()) {
          // 尝试 JSON 解析
          try {
            const parsed = JSON.parse(sm)

            if (Array.isArray(parsed)) {
              list = parsed
            } else if (parsed && typeof parsed === 'object') {
              // 对象格式 {"model1":"model1", ...} → 取 keys
              list = Object.keys(parsed)
            }
          } catch (_e) {
            // JSON 解析失败，按逗号/空格分隔
            list = sm
              .split(/[\s,]+/)
              .map((s) => s.trim())
              .filter(Boolean)
          }
        } else if (sm && typeof sm === 'object') {
          // 直接是对象（非字符串）
          list = Object.keys(sm)
        }

        if (list.length === 0) {
          return { unrestricted: true, models: [] }
        }

        return { unrestricted: false, models: list }
      } catch (e) {
        logger.warn(`⚠️  resolveAllowedModelsForApiKey 读取账号 ${accountId} 失败: ${e.message}`)

        return { unrestricted: false, models: [] }
      }
    }

    // 解析分组的辅助函数
    const resolveGroup = async (groupId) => {
      try {
        const memberIds = await accountGroupService.getGroupMembers(groupId)

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
          return null
        }

        const union = new Set()
        let sawConsole = false

        for (const memberId of memberIds) {
          const r = await collectFromAccount(memberId)

          if (r.models.length === 0 && !r.unrestricted) {
            // 非 claude-console 成员（取不到）忽略
            continue
          }
          sawConsole = true
          if (r.unrestricted) {
            return null
          } // 任一成员无限制即整体无限制
          r.models.forEach((m) => union.add(m))
        }
        if (!sawConsole) {
          return null
        }

        return union.size > 0 ? union : null
      } catch (e) {
        logger.warn(`⚠️  resolveAllowedModelsForApiKey 解析分组 ${groupId} 失败: ${e.message}`)

        return null
      }
    }

    // 1) 优先检查 claudeConsoleAccountId
    if (apiKey.claudeConsoleAccountId) {
      // 可能是 "group:xxx" 或直接账号 ID
      if (apiKey.claudeConsoleAccountId.startsWith('group:')) {
        const groupId = apiKey.claudeConsoleAccountId.replace('group:', '')

        return await resolveGroup(groupId)
      }
      // 直接账号 ID
      const r = await collectFromAccount(apiKey.claudeConsoleAccountId)

      if (r.unrestricted) {
        return null
      }

      return r.models.length > 0 ? new Set(r.models) : null
    }

    // 2) 回退：账号组（claudeAccountId 以 "group:" 开头）
    if (typeof apiKey.claudeAccountId === 'string' && apiKey.claudeAccountId.startsWith('group:')) {
      const groupId = apiKey.claudeAccountId.replace('group:', '')

      return await resolveGroup(groupId)
    }

    return null
  }

  /**
   * 按 provider 获取模型
   * @param {string} provider - 'anthropic', 'openai', 'google' 等
   */
  getModelsByProvider(provider) {
    return this.getAllModels().filter((m) => m.owned_by === provider)
  }

  /**
   * 检查模型是否被支持
   * @param {string} modelId - 模型 ID
   */
  isModelSupported(modelId) {
    if (!modelId) {
      return false
    }

    return this.getAllModels().some((m) => m.id === modelId)
  }

  /**
   * 获取模型的 provider
   * @param {string} modelId - 模型 ID
   */
  getModelProvider(modelId) {
    const model = this.getAllModels().find((m) => m.id === modelId)

    return model ? model.owned_by : null
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    const totalModels = Object.values(this.supportedModels).reduce(
      (sum, config) => sum + config.models.length,
      0
    )

    return {
      initialized: true,
      totalModels,
      providers: Object.keys(this.supportedModels)
    }
  }

  /**
   * 清理资源（保留接口兼容性）
   */
  cleanup() {
    logger.debug('📋 Model service cleanup (no-op)')
  }
}

module.exports = new ModelService()
