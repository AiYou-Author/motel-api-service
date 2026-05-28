<template>
  <div class="space-y-6">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">我的 API Key</h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          购买套餐后即可获得 API Key，前往商店开始使用。
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <router-link
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 sm:w-auto"
          to="/user/store"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
          Buy API Key
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center">
      <svg
        class="mx-auto h-8 w-8 animate-spin text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        ></path>
      </svg>
      <p class="mt-2 text-sm text-gray-500">Loading API keys...</p>
    </div>

    <!-- API Keys List -->
    <div v-else-if="sortedApiKeys.length > 0" class="overflow-hidden bg-white shadow sm:rounded-md">
      <ul class="divide-y divide-gray-200" role="list">
        <li v-for="apiKey in sortedApiKeys" :key="apiKey.id" class="px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'h-2 w-2 rounded-full',
                    apiKey.isDeleted === true || apiKey.deletedAt
                      ? 'bg-gray-400'
                      : apiKey.isActive
                        ? 'bg-green-400'
                        : 'bg-red-400'
                  ]"
                ></div>
              </div>
              <div class="ml-4">
                <div class="flex items-center">
                  <p class="text-sm font-medium text-gray-900">{{ apiKey.name }}</p>
                  <span
                    v-if="apiKey.isDeleted === true || apiKey.deletedAt"
                    class="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                  >
                    已删除
                  </span>
                  <span
                    v-else-if="!apiKey.isActive"
                    class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
                  >
                    已停用
                  </span>
                </div>
                <div class="mt-1">
                  <p class="text-sm text-gray-500">{{ apiKey.description || '暂无描述' }}</p>
                  <div class="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                    <span>创建于：{{ formatDate(apiKey.createdAt) }}</span>
                    <span v-if="apiKey.isDeleted === 'true' || apiKey.deletedAt"
                      >已删除：{{ formatDate(apiKey.deletedAt) }}</span
                    >
                    <span v-else-if="apiKey.lastUsedAt"
                      >最近使用：{{ formatDate(apiKey.lastUsedAt) }}</span
                    >
                    <span v-else>从未使用</span>
                    <span
                      v-if="apiKey.expiresAt && !(apiKey.isDeleted === 'true' || apiKey.deletedAt)"
                      >过期时间：{{ formatDate(apiKey.expiresAt) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <!-- Usage Stats -->
              <div class="text-right text-xs text-gray-500">
                <div>{{ formatNumber(apiKey.usage?.requests || 0) }} 次请求</div>
                <div v-if="apiKey.usage?.totalCost">${{ apiKey.usage.totalCost.toFixed(4) }}</div>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-1">
                <button
                  class="inline-flex items-center rounded border border-transparent p-1 text-gray-400 hover:text-gray-600"
                  title="查看 API Key"
                  @click="showApiKey(apiKey)"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </button>

                <button
                  v-if="
                    !(apiKey.isDeleted === 'true' || apiKey.deletedAt) &&
                    apiKey.isActive &&
                    allowUserDeleteApiKeys
                  "
                  class="inline-flex items-center rounded border border-transparent p-1 text-red-400 hover:text-red-600"
                  title="删除 API Key"
                  @click="deleteApiKey(apiKey)"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-lg bg-white py-16 text-center shadow dark:bg-gray-800">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无 API Key</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">购买套餐即可获得 API Key。</p>
      <div class="mt-6">
        <router-link
          class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          to="/user/store"
        >
          <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
          Browse Plans
        </router-link>
      </div>
    </div>

    <!-- View API Key Modal -->
    <ViewApiKeyModal
      :api-key="selectedApiKey"
      :show="showViewModal"
      @close="showViewModal = false"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      confirm-class="bg-red-600 hover:bg-red-700"
      confirm-text="删除"
      :message="`确定要删除 '${selectedApiKey?.name}' 吗？此操作无法撤销。`"
      :show="showDeleteModal"
      title="删除 API Key"
      @cancel="showDeleteModal = false"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { showToast, formatNumber, formatDate } from '@/utils/tools'
import ViewApiKeyModal from './ViewApiKeyModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const userStore = useUserStore()

const loading = ref(true)
const apiKeys = ref([])
const allowUserDeleteApiKeys = computed(() => userStore.config?.allowUserDeleteApiKeys === true)

const showViewModal = ref(false)
const showDeleteModal = ref(false)
const selectedApiKey = ref(null)

const sortedApiKeys = computed(() => {
  return [...apiKeys.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const loadApiKeys = async () => {
  loading.value = true
  try {
    apiKeys.value = await userStore.getUserApiKeys(true)
  } catch (error) {
    showToast('加载 API Key 失败', 'error')
  } finally {
    loading.value = false
  }
}

const showApiKey = (apiKey) => {
  selectedApiKey.value = apiKey
  showViewModal.value = true
}

const deleteApiKey = (apiKey) => {
  selectedApiKey.value = apiKey
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  try {
    const result = await userStore.deleteApiKey(selectedApiKey.value.id)

    if (result.success) {
      showToast('API Key 已删除', 'success')
      await loadApiKeys()
    }
  } catch (error) {
    showToast('删除 API Key 失败', 'error')
  } finally {
    showDeleteModal.value = false
    selectedApiKey.value = null
  }
}

onMounted(() => {
  loadApiKeys()
})
</script>
