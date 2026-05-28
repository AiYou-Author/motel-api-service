<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">推广返佣配置</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">配置推广奖励的返佣比例和功能开关</p>
    </div>

    <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="p-6 space-y-6">
        <!-- 功能开关 -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">推广功能开关</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">开启后用户可以使用推广功能，获得返佣奖励</p>
          </div>
          <button
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              config.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            ]"
            type="button"
            @click="config.enabled = !config.enabled"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              ]"
            />
          </button>
        </div>

        <!-- 全局返佣比例 -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">全局返佣比例 (%)</label>
            <input
              v-model.number="config.globalRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="10"
            />
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              所有套餐默认的返佣比例，如设置为10，则用户购买100元套餐，推荐人获得10元佣金
            </p>
          </div>
        </div>

        <!-- 套餐单独返佣配置 -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">套餐单独返佣配置</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            优先级高于全局比例，为空则使用全局比例
          </p>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">套餐名称</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">套餐类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">价格</th>
                  <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">返佣比例 (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                <tr v-for="plan in plans" :key="plan.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ plan.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ plan.planType === 'payg' ? '按量付费' : '固定套餐' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ plan.price ? '¥' + plan.price : '自定义' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <input
                      v-model.number="config.planRates[plan.id]"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      class="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      :placeholder="config.globalRate * 100"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            :disabled="saving"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            @click="saveConfig"
          >
            {{ saving ? '保存中…' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from '@/utils/tools'
import { getReferralConfigApi, updateReferralConfigApi, getPlansApi } from '@/utils/http_apis'

const config = ref({
  enabled: false,
  globalRate: 0.1,
  planRates: {}
})
const plans = ref([])
const saving = ref(false)

const loadConfig = async () => {
  try {
    const data = await getReferralConfigApi()

    config.value = {
      enabled: data.enabled || false,
      globalRate: data.globalRate * 100 || 10,
      planRates: Object.fromEntries(
        Object.entries(data.planRates || {}).map(([id, rate]) => [id, rate * 100])
      )
    }
  } catch (error) {
    showToast('加载配置失败', 'error')
  }
}

const loadPlans = async () => {
  try {
    const data = await getPlansApi(false) // 包含禁用套餐

    plans.value = data
  } catch (error) {
    showToast('加载套餐列表失败', 'error')
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const saveData = {
      enabled: config.value.enabled,
      globalRate: config.value.globalRate / 100,
      planRates: Object.fromEntries(
        Object.entries(config.value.planRates).map(([id, rate]) => [id, rate ? rate / 100 : undefined])
      )
    }

    await updateReferralConfigApi(saveData)
    showToast('配置保存成功', 'success')
  } catch (error) {
    showToast('保存失败', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadPlans()
})
</script>
