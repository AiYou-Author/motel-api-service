<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
      <div
        class="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700"
      >
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEdit ? '编辑自定义价格' : '新增自定义价格' }}
        </h3>
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          @click="$emit('close')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>

      <form class="space-y-3 px-5 py-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            模型名称 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.model"
            class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
            :disabled="isEdit"
            placeholder="如 MiniMax-M2"
            required
            type="text"
          />
          <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            仅允许字母、数字、._-/，最长 64 字符
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              输入 USD/MTok <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="form.inputPerMillion"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              placeholder="0.30"
              required
              step="0.0001"
              type="number"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              输出 USD/MTok <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="form.outputPerMillion"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              placeholder="1.20"
              required
              step="0.0001"
              type="number"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              缓存创建 USD/MTok
            </label>
            <input
              v-model.number="form.cacheCreatePerMillion"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              placeholder="可选"
              step="0.0001"
              type="number"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              缓存读取 USD/MTok
            </label>
            <input
              v-model.number="form.cacheReadPerMillion"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              placeholder="可选"
              step="0.0001"
              type="number"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              上下文窗口（tokens）
            </label>
            <input
              v-model.number="form.maxTokens"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              min="0"
              placeholder="可选"
              step="1"
              type="number"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              提供商标识
            </label>
            <input
              v-model.trim="form.provider"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="如 minimax"
              type="text"
            />
          </div>
        </div>

        <p
          class="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700 dark:border-yellow-700/50 dark:bg-yellow-900/20 dark:text-yellow-200"
        >
          自定义价格将覆盖远程同步的同名模型，且不会被刷新操作覆盖。
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <button
            class="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            :disabled="submitting"
            type="button"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            class="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
            :disabled="
              submitting ||
              !form.model ||
              form.inputPerMillion == null ||
              form.outputPerMillion == null
            "
            type="submit"
          >
            {{ submitting ? '保存中…' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { setCustomPricingApi } from '@/utils/http_apis'
import { showToast } from '@/utils/tools'

const props = defineProps({
  show: { type: Boolean, default: false },
  initial: { type: Object, default: null }
})
const emit = defineEmits(['close', 'saved'])

const isEdit = ref(false)
const submitting = ref(false)
const form = ref({
  model: '',
  inputPerMillion: null,
  outputPerMillion: null,
  cacheCreatePerMillion: null,
  cacheReadPerMillion: null,
  maxTokens: null,
  provider: ''
})

watch(
  () => props.show,
  (v) => {
    if (!v) return
    if (props.initial) {
      isEdit.value = true
      const d = props.initial

      form.value = {
        model: d.model,
        inputPerMillion: (Number(d.input_cost_per_token) || 0) * 1e6,
        outputPerMillion: (Number(d.output_cost_per_token) || 0) * 1e6,
        cacheCreatePerMillion: (Number(d.cache_creation_input_token_cost) || 0) * 1e6 || null,
        cacheReadPerMillion: (Number(d.cache_read_input_token_cost) || 0) * 1e6 || null,
        maxTokens: Number(d.max_tokens) || null,
        provider: d.litellm_provider || ''
      }
    } else {
      isEdit.value = false
      form.value = {
        model: '',
        inputPerMillion: null,
        outputPerMillion: null,
        cacheCreatePerMillion: null,
        cacheReadPerMillion: null,
        maxTokens: null,
        provider: ''
      }
    }
  }
)

async function onSubmit() {
  if (submitting.value) return
  submitting.value = true
  const f = form.value
  const payload = {
    input_cost_per_token: (Number(f.inputPerMillion) || 0) / 1e6,
    output_cost_per_token: (Number(f.outputPerMillion) || 0) / 1e6,
    cache_creation_input_token_cost: f.cacheCreatePerMillion
      ? Number(f.cacheCreatePerMillion) / 1e6
      : 0,
    cache_read_input_token_cost: f.cacheReadPerMillion ? Number(f.cacheReadPerMillion) / 1e6 : 0,
    max_tokens: Number(f.maxTokens) || 0,
    litellm_provider: f.provider || 'custom'
  }

  try {
    const result = await setCustomPricingApi(f.model.trim(), payload)

    if (result?.success) {
      showToast(isEdit.value ? '已更新' : '已添加', 'success')
      emit('saved', result.data)
      emit('close')
    } else {
      showToast(result?.message || '保存失败', 'error')
    }
  } catch (e) {
    showToast(e?.response?.data?.message || e?.message || '保存失败', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
