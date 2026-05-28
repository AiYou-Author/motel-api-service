<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">提现审核</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">审核用户的提现申请</p>
    </div>

    <!-- 过滤 -->
    <div class="flex items-center space-x-4">
      <select
        v-model="filterStatus"
        class="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        @change="loadWithdrawals"
      >
        <option value="">全部状态</option>
        <option value="pending">待审核</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
    </div>

    <!-- 列表 -->
    <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">申请时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">用户ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">收款方式</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">收款账号</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">用户备注</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            <tr v-for="record in withdrawals" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ formatDate(record.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ record.userId }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                ¥{{ record.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ record.method === 'alipay' ? '支付宝' : record.method === 'wechat' ? '微信支付' : '银行卡' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                {{ record.accountInfo }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  :class="[
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                    record.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    record.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  ]"
                >
                  {{ record.status === 'pending' ? '待审核' : record.status === 'approved' ? '已通过' : '已拒绝' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                {{ record.note || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div v-if="record.status === 'pending'" class="flex items-center space-x-2">
                  <button
                    class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    @click="openApproveDialog(record)"
                  >
                    通过
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    @click="openRejectDialog(record)"
                  >
                    拒绝
                  </button>
                </div>
                <span v-else class="text-gray-500 dark:text-gray-400">
                  {{ record.adminNote || '-' }}
                </span>
              </td>
            </tr>
            <tr v-if="withdrawals.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                暂无提现申请
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 审核通过弹窗 -->
    <div v-if="approveDialogOpen" class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-80" @click="closeDialog" />
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div class="inline-block w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:max-w-lg sm:p-6 sm:align-middle">
          <div>
            <div class="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                通过提现申请
              </h3>
              <div class="mt-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  确认要通过该提现申请吗？金额：¥{{ selectedRecord?.amount?.toFixed(2) }}
                </p>
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">备注（可选）</label>
                  <textarea
                    v-model="approveNote"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="填写备注信息"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              :disabled="processing"
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm dark:bg-green-500 dark:hover:bg-green-600"
              @click="confirmApprove"
            >
              {{ processing ? '处理中…' : '确认通过' }}
            </button>
            <button
              type="button"
              class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              @click="closeDialog"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 拒绝弹窗 -->
    <div v-if="rejectDialogOpen" class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-80" @click="closeDialog" />
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
        <div class="inline-block w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:max-w-lg sm:p-6 sm:align-middle">
          <div>
            <div class="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                拒绝提现申请
              </h3>
              <div class="mt-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  拒绝该提现申请，金额将退回用户佣金账户
                </p>
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">拒绝原因（必填）</label>
                  <textarea
                    v-model="rejectReason"
                    rows="3"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="请填写拒绝原因"
                    required
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              :disabled="processing || !rejectReason"
              class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm dark:bg-red-500 dark:hover:bg-red-600"
              @click="confirmReject"
            >
              {{ processing ? '处理中…' : '确认拒绝' }}
            </button>
            <button
              type="button"
              class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              @click="closeDialog"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, formatDate } from '@/utils/tools'
import { getAdminWithdrawalsApi, approveWithdrawApi, rejectWithdrawApi } from '@/utils/http_apis'

const filterStatus = ref('')
const withdrawals = ref([])
const approveDialogOpen = ref(false)
const rejectDialogOpen = ref(false)
const selectedRecord = ref(null)
const approveNote = ref('')
const rejectReason = ref('')
const processing = ref(false)

const loadWithdrawals = async () => {
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const { requests } = await getAdminWithdrawalsApi(params)

    withdrawals.value = requests
  } catch (error) {
    showToast('加载提现列表失败', 'error')
  }
}

const openApproveDialog = (record) => {
  selectedRecord.value = record
  approveNote.value = ''
  approveDialogOpen.value = true
}

const openRejectDialog = (record) => {
  selectedRecord.value = record
  rejectReason.value = ''
  rejectDialogOpen.value = true
}

const closeDialog = () => {
  approveDialogOpen.value = false
  rejectDialogOpen.value = false
  selectedRecord.value = null
  approveNote.value = ''
  rejectReason.value = ''
}

const confirmApprove = async () => {
  processing.value = true
  try {
    await approveWithdrawApi(selectedRecord.value.id, { adminNote: approveNote.value })
    showToast('审核通过成功', 'success')
    closeDialog()
    await loadWithdrawals()
  } catch (error) {
    showToast('操作失败', 'error')
  } finally {
    processing.value = false
  }
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showToast('请填写拒绝原因', 'error')

    return
  }
  processing.value = true
  try {
    await rejectWithdrawApi(selectedRecord.value.id, { reason: rejectReason.value })
    showToast('已拒绝提现申请，金额已退回用户账户', 'success')
    closeDialog()
    await loadWithdrawals()
  } catch (error) {
    showToast('操作失败', 'error')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadWithdrawals()
})
</script>
