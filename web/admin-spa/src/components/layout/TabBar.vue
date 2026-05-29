<template>
  <div class="mb-3 sm:mb-6">
    <!-- 移动端下拉选择器 -->
    <div class="block rounded-xl bg-white/10 p-2 backdrop-blur-sm dark:bg-gray-800/20 sm:hidden">
      <select
        class="focus:ring-primary-color w-full cursor-pointer rounded-lg bg-white/90 px-4 py-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 dark:bg-gray-800/90 dark:text-gray-200 dark:focus:ring-indigo-400"
        :value="activeTab"
        @change="$emit('tab-change', $event.target.value)"
      >
        <option v-for="tab in tabs" :key="tab.key" :value="tab.key">
          {{ tab.name }}
        </option>
      </select>
    </div>

    <!-- 桌面端标签栏 -->
    <div
      class="hidden flex-wrap gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-sm dark:bg-gray-800/20 sm:flex"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'tab-btn flex-1 px-3 py-2 text-xs font-semibold transition-all duration-300 sm:px-4 sm:py-3 sm:text-sm md:px-6',
          activeTab === tab.key
            ? 'active'
            : 'text-gray-700 hover:bg-white/10 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/30 dark:hover:text-gray-100'
        ]"
        @click="$emit('tab-change', tab.key)"
      >
        <i :class="tab.icon + ' mr-1 sm:mr-2'" />
        <span class="hidden md:inline">{{ tab.name }}</span>
        <span class="md:hidden">{{ tab.shortName || tab.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  activeTab: {
    type: String,
    required: true
  }
})

defineEmits(['tab-change'])

// 根据 LDAP 配置动态生成 tabs
const tabs = computed(() => {
  const baseTabs = [
    { key: 'dashboard', name: '仪表板', shortName: '仪表板', icon: 'fas fa-tachometer-alt' },
    { key: 'apiKeys', name: 'API Keys', shortName: 'API', icon: 'fas fa-key' },
    { key: 'accounts', name: '账户管理', shortName: '账户', icon: 'fas fa-user-circle' },
    { key: 'requestDetails', name: '请求明细', shortName: '明细', icon: 'fas fa-table' },
    { key: 'quotaCards', name: '额度卡', shortName: '额度卡', icon: 'fas fa-ticket-alt' }
  ]

  baseTabs.push({
    key: 'userManagement',
    name: '用户管理',
    shortName: '用户',
    icon: 'fas fa-users'
  })

  baseTabs.push({
    key: 'storeOrders',
    name: '商店订单',
    shortName: '订单',
    icon: 'fas fa-shopping-cart'
  })
  baseTabs.push({
    key: 'storePlans',
    name: '商城套餐',
    shortName: '套餐',
    icon: 'fas fa-tags'
  })
  baseTabs.push({ key: 'settings', name: '系统设置', shortName: '设置', icon: 'fas fa-cogs' })
  baseTabs.push({
    key: 'referral',
    name: '推广奖励',
    shortName: '推广',
    icon: 'fas fa-gift'
  })

  return baseTabs
})
</script>
