<template>
  <div
    class="rounded-xl bg-white p-6 shadow ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
  >
    <div class="mb-4 flex items-center justify-between gap-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">用量概览</h3>
      <div v-if="activeKeys.length > 0" class="flex items-center gap-3">
        <select
          v-model="selectedKeyId"
          class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          @change="loadStats(selectedKeyId)"
        >
          <option v-for="k in activeKeys" :key="k.id" :value="k.id">
            {{ k.name || 'Key ' + k.id.slice(0, 8) + '…' }}
          </option>
        </select>
        <button
          class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          @click="$emit('view-details')"
        >
          查看详情 →
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-10">
      <svg
        class="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400"
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

    <div
      v-else-if="activeKeys.length === 0"
      class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-8 text-center dark:border-gray-600"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">暂无活跃的 API Key。</p>
      <router-link
        class="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
        to="/user/store"
      >
        购买套餐立即开始 →
      </router-link>
    </div>

    <StatsOverview v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useApiStatsStore } from '@/stores/apistats'
import { showToast } from '@/utils/tools'
import StatsOverview from '@/components/apistats/StatsOverview.vue'

defineEmits(['view-details'])

const userStore = useUserStore()
const apiStatsStore = useApiStatsStore()
const { apiId } = storeToRefs(apiStatsStore)

const loading = ref(true)
const allKeys = ref([])
const selectedKeyId = ref(null)

const activeKeys = computed(() =>
  allKeys.value.filter((k) => !(k.isDeleted === 'true' || k.deletedAt))
)

const loadStats = async (keyId) => {
  if (!keyId) return
  apiId.value = keyId
  await apiStatsStore.loadStatsWithApiId()
}

onMounted(async () => {
  try {
    allKeys.value = await userStore.getUserApiKeys(true)
    if (activeKeys.value.length > 0) {
      selectedKeyId.value = activeKeys.value[0].id
      await loadStats(selectedKeyId.value)
    }
  } catch {
    showToast('加载用量概览失败', 'error')
  } finally {
    loading.value = false
  }
})
</script>
