<template>
  <div class="tab-content">
    <div class="card p-4 sm:p-6">
      <!-- Header -->
      <div class="mb-4 flex flex-col gap-4 sm:mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100 sm:mb-2 sm:text-xl">
              商店订单
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              审批用户购买 API Key 的订单
            </p>
          </div>
          <button
            class="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            :disabled="loading"
            @click="loadOrders"
          >
            <i class="fas fa-sync-alt mr-2" :class="{ 'animate-spin': loading }" />
            刷新
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400">待审批</p>
                <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400 sm:text-2xl">
                  {{ stats.pending }}
                </p>
              </div>
              <div class="stat-icon flex-shrink-0 bg-gradient-to-br from-yellow-500 to-yellow-600">
                <i class="fas fa-clock" />
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400">已通过</p>
                <p class="text-xl font-bold text-green-600 dark:text-green-400 sm:text-2xl">
                  {{ stats.approved }}
                </p>
              </div>
              <div class="stat-icon flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600">
                <i class="fas fa-check-circle" />
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="flex items-center justify-between">
              <div>
                <p class="mb-1 text-xs font-semibold text-gray-600 dark:text-gray-400">已拒绝</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-400 sm:text-2xl">
                  {{ stats.rejected }}
                </p>
              </div>
              <div class="stat-icon flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600">
                <i class="fas fa-times-circle" />
              </div>
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in filters"
            :key="f.value"
            :class="[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            ]"
            @click="setFilter(f.value)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <i class="fas fa-spinner animate-spin text-2xl text-blue-600 dark:text-blue-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="orders.length === 0" class="py-12 text-center">
        <i class="fas fa-inbox mb-3 text-4xl text-gray-400" />
        <p class="text-gray-500 dark:text-gray-400">暂无订单</p>
      </div>

      <!-- Orders Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr
              class="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <th class="pb-3 pr-4">订单 ID</th>
              <th class="pb-3 pr-4">渠道 / 套餐</th>
              <th class="pb-3 pr-4">用户</th>
              <th class="pb-3 pr-4">充值金额</th>
              <th class="pb-3 pr-4">USD 额度</th>
              <th class="pb-3 pr-4">状态</th>
              <th class="pb-3 pr-4">下单时间</th>
              <th class="pb-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <tr v-for="order in orders" :key="order.orderId" class="text-sm">
              <td class="py-3 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                {{ order.orderId.slice(0, 12) }}…
              </td>
              <td class="py-3 pr-4">
                <div class="flex flex-col gap-0.5">
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{
                    order.planName
                  }}</span>
                  <span
                    v-if="order.channel"
                    class="inline-block w-fit rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {{ order.channel }}
                  </span>
                </div>
              </td>
              <td class="py-3 pr-4 text-gray-600 dark:text-gray-300">
                {{ order.userId || order.contactInfo || '—' }}
              </td>
              <td class="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                {{ order.amount != null ? '¥' + order.amount : '—' }}
              </td>
              <td class="py-3 pr-4 font-medium text-blue-600 dark:text-blue-400">
                {{ order.creditUSD != null ? '$' + Number(order.creditUSD).toFixed(4) : '—' }}
              </td>
              <td class="py-3 pr-4">
                <span
                  :class="[
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    order.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : order.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  ]"
                >
                  {{
                    order.status === 'approved'
                      ? '已通过'
                      : order.status === 'rejected'
                        ? '已拒绝'
                        : '待审批'
                  }}
                </span>
              </td>
              <td class="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="py-3">
                <div v-if="order.status === 'pending'" class="flex gap-2">
                  <button
                    class="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    :disabled="processingId === order.orderId"
                    @click="approve(order)"
                  >
                    <i class="fas fa-check mr-1" />
                    审批
                  </button>
                  <button
                    class="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    :disabled="processingId === order.orderId"
                    @click="openReject(order)"
                  >
                    <i class="fas fa-times mr-1" />
                    拒绝
                  </button>
                </div>
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reject Modal -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div class="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white">拒绝订单</h3>
        </div>
        <div class="space-y-3 px-5 py-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            订单：<span class="font-mono">{{ rejectTarget?.orderId.slice(0, 12) }}…</span>
          </p>
          <textarea
            v-model="rejectReason"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="拒绝原因（可选）"
            rows="3"
          />
          <div class="flex gap-2 pt-1">
            <button
              class="flex-1 rounded-md border border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showRejectModal = false"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-md bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="processingId === rejectTarget?.orderId"
              @click="confirmReject"
            >
              确认拒绝
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAdminOrdersApi, approveOrderApi, rejectOrderApi } from '@/utils/http_apis'
import { showToast, formatDate } from '@/utils/tools'

const loading = ref(false)
const orders = ref([])
const processingId = ref(null)
const activeFilter = ref('')
const showRejectModal = ref(false)
const rejectTarget = ref(null)
const rejectReason = ref('')

const filters = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
]

const stats = computed(() => ({
  pending: orders.value.filter((o) => o.status === 'pending').length,
  approved: orders.value.filter((o) => o.status === 'approved').length,
  rejected: orders.value.filter((o) => o.status === 'rejected').length
}))

const setFilter = (value) => {
  activeFilter.value = value
  loadOrders()
}

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getAdminOrdersApi(activeFilter.value || undefined)

    orders.value = res.orders || []
  } catch {
    showToast('加载订单失败', 'error')
  } finally {
    loading.value = false
  }
}

const approve = async (order) => {
  processingId.value = order.orderId
  try {
    await approveOrderApi(order.orderId)
    showToast('审批通过，API Key 已生成', 'success')
    await loadOrders()
  } catch (err) {
    showToast(err.response?.data?.error || '审批失败', 'error')
  } finally {
    processingId.value = null
  }
}

const openReject = (order) => {
  rejectTarget.value = order
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  processingId.value = rejectTarget.value.orderId
  try {
    await rejectOrderApi(rejectTarget.value.orderId, rejectReason.value)
    showToast('订单已拒绝', 'success')
    showRejectModal.value = false
    await loadOrders()
  } catch (err) {
    showToast(err.response?.data?.error || '操作失败', 'error')
  } finally {
    processingId.value = null
  }
}

onMounted(loadOrders)
</script>
