<template>
  <Teleport to="body">
    <div class="modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="modal-content custom-scrollbar mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto p-8"
      >
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600"
            >
              <i class="fas fa-key text-lg text-white" />
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">API Key 信息</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ apiKey.name || '密钥信息' }}
              </p>
            </div>
          </div>
          <button
            class="text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            title="关闭"
            @click="$emit('close')"
          >
            <i class="fas fa-times text-xl" />
          </button>
        </div>

        <!-- API Key 信息 -->
        <div class="mb-6 space-y-4">
          <div v-if="apiKey.name">
            <label class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >名称</label
            >
            <div
              class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800"
            >
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ apiKey.name }}</span>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >API Key</label
            >
            <div class="relative">
              <div
                class="flex min-h-[60px] items-center break-all rounded-lg border border-gray-700 bg-gray-900 p-4 pr-14 font-mono text-sm text-white dark:border-gray-600 dark:bg-gray-900"
              >
                {{ getDisplayedApiKey() }}
              </div>
              <div class="absolute right-3 top-3">
                <button
                  class="btn-icon-sm bg-gray-700 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  :title="showFullKey ? '隐藏API Key' : '显示完整API Key'"
                  type="button"
                  @click="toggleKeyVisibility"
                >
                  <i :class="['fas', showFullKey ? 'fa-eye-slash' : 'fa-eye', 'text-gray-300']" />
                </button>
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              点击眼睛图标切换显示模式，使用下方按钮复制
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-3 sm:gap-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20 sm:flex-1 sm:text-base"
              @click="copyKeyOnly"
            >
              <i class="fas fa-key" />
              仅复制密钥
            </button>
            <button
              class="btn btn-primary flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold sm:flex-1 sm:text-base"
              @click="copyFullConfig"
            >
              <i class="fas fa-copy" />
              复制Claude配置
            </button>
          </div>
          <button
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 sm:text-base"
            @click="$emit('close')"
          >
            <i class="fas fa-check-circle" />
            完成
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from '@/utils/tools'

const props = defineProps({
  apiKey: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const showFullKey = ref(false)

// 获取 API Base URL 前缀
const getBaseUrlPrefix = () => {
  // 优先使用环境变量配置的自定义前缀
  const customPrefix = import.meta.env.VITE_API_BASE_PREFIX

  if (customPrefix) {
    return customPrefix.replace(/\/$/, '')
  }

  // 否则使用当前浏览器访问地址
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const host = window.location.host
    let origin = protocol + '//' + host

    const currentUrl = window.location.href
    const pathStart = currentUrl.indexOf('/', 8)

    if (pathStart !== -1) {
      origin = currentUrl.substring(0, pathStart)
    }

    return origin
  }

  return ''
}

// 计算完整的 API Base URL
const currentBaseUrl = getBaseUrlPrefix() + '/api'

// 切换密钥可见性
const toggleKeyVisibility = () => {
  showFullKey.value = !showFullKey.value
}

// 获取显示的API Key
const getDisplayedApiKey = () => {
  const key = props.apiKey.apiKey || props.apiKey.key || props.apiKey.apiKeyValue || ''

  if (!key) return '无'

  if (showFullKey.value) {
    return key
  } else {
    if (key.length <= 12) return key

    return (
      key.substring(0, 8) + '●'.repeat(Math.max(0, key.length - 12)) + key.substring(key.length - 4)
    )
  }
}

// 通用复制工具
const copyTextWithFallback = async (text, successMessage) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(successMessage, 'success')
  } catch (error) {
    const textArea = document.createElement('textarea')

    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      showToast(successMessage, 'success')
    } catch (fallbackError) {
      showToast('复制失败，请手动复制', 'error')
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// 复制完整配置（Claude 环境变量）
const copyFullConfig = async () => {
  const key = props.apiKey.apiKey || props.apiKey.key || props.apiKey.apiKeyValue || ''

  if (!key) {
    showToast('API Key 不存在', 'error')

    return
  }

  const configText = `export ANTHROPIC_BASE_URL="${currentBaseUrl}"
export ANTHROPIC_AUTH_TOKEN="${key}"`

  await copyTextWithFallback(configText, 'Claude配置已复制')
}

// 仅复制密钥
const copyKeyOnly = async () => {
  const key = props.apiKey.apiKey || props.apiKey.key || props.apiKey.apiKeyValue || ''

  if (!key) {
    showToast('API Key 不存在', 'error')

    return
  }

  await copyTextWithFallback(key, 'API Key 已复制')
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
