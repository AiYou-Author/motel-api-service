<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">用量统计</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        查看 API Key 的 Token 使用情况与按模型的明细分布。
      </p>
    </div>

    <!-- Key 切换按钮组 -->
    <div
      v-if="activeKeys.length > 0"
      class="rounded-xl bg-white p-4 shadow ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
    >
      <p
        class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        Select API Key
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="k in activeKeys"
          :key="k.id"
          :class="[
            'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
            selectedKeyId === k.id
              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
          @click="switchKey(k.id)"
        >
          <span
            :class="[
              'h-2 w-2 flex-shrink-0 rounded-full',
              selectedKeyId === k.id
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-gray-300 dark:bg-gray-500'
            ]"
          />
          <span class="max-w-[180px] truncate">{{
            k.name || 'Key ' + k.id.slice(0, 8) + '…'
          }}</span>
          <span
            v-if="selectedKeyId === k.id"
            class="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
          >
            活跃
          </span>
        </button>
      </div>
    </div>

    <!-- 无 Key 状态 -->
    <div
      v-if="!loading && activeKeys.length === 0"
      class="rounded-lg bg-white py-16 text-center shadow dark:bg-gray-800"
    >
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
        />
      </svg>
      <p class="mt-4 text-gray-500 dark:text-gray-400">暂无活跃的 API Key。</p>
      <router-link
        class="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        to="/user/store"
      >
        购买套餐立即开始 →
      </router-link>
    </div>

    <!-- 加载中 -->
    <div v-else-if="loading" class="flex items-center justify-center py-20">
      <svg
        class="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        />
      </svg>
    </div>

    <!-- 统计内容：复用 ApiStatsView 的核心组件 -->
    <template v-else>
      <!-- 统计概览 -->
      <StatsOverview />

      <!-- Token 使用图表 -->
      <TokenDistribution />

      <!-- 模型用量 Tabs -->
      <div
        class="rounded-xl bg-white shadow ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
      >
        <div class="border-b border-gray-200 px-6 pt-4 dark:border-gray-700">
          <nav class="-mb-px flex space-x-6">
            <button
              v-for="tab in periodTabs"
              :key="tab.value"
              :class="[
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activePeriod === tab.value
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
              @click="activePeriod = tab.value"
            >
              {{ tab.label }}
            </button>
          </nav>
        </div>
        <div class="p-6">
          <ModelUsageStats :period="activePeriod" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useApiStatsStore } from '@/stores/apistats'
import { showToast } from '@/utils/tools'
import StatsOverview from '@/components/apistats/StatsOverview.vue'
import TokenDistribution from '@/components/apistats/TokenDistribution.vue'
import ModelUsageStats from '@/components/apistats/ModelUsageStats.vue'

const userStore = useUserStore()
const apiStatsStore = useApiStatsStore()
const { apiId } = storeToRefs(apiStatsStore)

const loading = ref(true)
const allKeys = ref([])
const selectedKeyId = ref(null)
const activePeriod = ref('daily')

const periodTabs = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'alltime', label: 'All Time' }
]

const activeKeys = computed(() =>
  allKeys.value.filter((k) => !(k.isDeleted === 'true' || k.deletedAt))
)

const loadStats = async (keyId) => {
  apiId.value = keyId
  await apiStatsStore.loadStatsWithApiId()
}

const switchKey = (keyId) => {
  if (selectedKeyId.value !== keyId) {
    selectedKeyId.value = keyId
    loadStats(keyId)
  }
}

onMounted(async () => {
  try {
    allKeys.value = await userStore.getUserApiKeys(true)
    if (activeKeys.value.length > 0) {
      selectedKeyId.value = activeKeys.value[0].id
      await loadStats(selectedKeyId.value)
    }
  } catch {
    showToast('Failed to load usage stats', 'error')
  } finally {
    loading.value = false
  }
})
</script>
