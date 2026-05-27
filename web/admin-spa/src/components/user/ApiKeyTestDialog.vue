<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
    >
      <div
        class="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700"
      >
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            自测对话 · {{ order?.planName || '未知套餐' }}
          </h3>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">订单 #{{ order?.orderId }}</p>
        </div>
        <button
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          @click="$emit('close')"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
        </button>
      </div>
      <ApiKeyTestPanel :active="show" :order="order" />
    </div>
  </div>
</template>

<script setup>
import ApiKeyTestPanel from './ApiKeyTestPanel.vue'

defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null }
})
defineEmits(['close'])
</script>
