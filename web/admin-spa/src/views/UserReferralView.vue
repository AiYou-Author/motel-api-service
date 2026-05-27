<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">推广奖励</h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">邀请好友注册购买，即可获得佣金奖励</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">可用佣金</dt>
                <dd class="text-2xl font-bold text-gray-900 dark:text-white">¥{{ referralInfo.balance?.toFixed(2) || 0.00 }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="ml-4 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">已邀请用户</dt>
                <dd class="text-2xl font-bold text-gray-900 dark:text-white">{{ referralInfo.invitedCount || 0 }} 人</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div class="p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4 w-0 flex-1">
              <dl>
                <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">累计返佣</dt>
                <dd class="text-2xl font-bold text-gray-900 dark:text-white">¥{{ totalCommission?.toFixed(2) || 0.00 }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推广码区域 -->
    <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">我的推广链接</h3>
        <div class="flex items-center space-x-4">
          <div class="flex-1">
            <div class="flex rounded-md shadow-sm">
              <input
                type="text"
                readonly
                :value="referralLink"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <button
                type="button"
                @click="copyReferralLink"
                class="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>复制</span>
              </button>
            </div>
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          新用户通过以上链接注册并购买套餐，您将获得订单金额 {{ referralInfo.commissionRate * 100 || 0 }}% 的返佣奖励
        </p>
      </div>
    </div>

    <!-- 标签页切换 -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          :class="[
            activeTab === 'records' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
          @click="activeTab = 'records'"
        >
          返佣记录
        </button>
        <button
          :class="[
            activeTab === 'withdraw' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
          @click="activeTab = 'withdraw'"
        >
          提现申请
        </button>
        <button
          :class="[
            activeTab === 'withdrawRecords' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
          @click="activeTab = 'withdrawRecords'"
        >
          提现记录
        </button>
      </nav>
    </div>

    <!-- 返佣记录 -->
    <div v-if="activeTab === 'records'" class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">返佣记录</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">来源</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">备注</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            <tr v-for="record in commissionRecords" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ formatDate(record.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ record.type === 'commission' ? '订单返佣' : record.type === 'refund' ? '退款退回' : '其他' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm" :class="record.direction === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ record.direction === 'credit' ? '+' : '-' }}¥{{ record.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ record.note }}
              </td>
            </tr>
            <tr v-if="commissionRecords.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                暂无返佣记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 提现申请 -->
    <div v-if="activeTab === 'withdraw'" class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="p-6 max-w-2xl">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-6">申请提现</h3>
        <form @submit.prevent="submitWithdraw" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">提现金额</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 dark:text-gray-400 sm:text-sm">¥</span>
              </div>
              <input
                v-model.number="withdrawForm.amount"
                type="number"
                min="0"
                step="0.01"
                :max="referralInfo.balance"
                class="block w-full pl-7 pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="0.00"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 dark:text-gray-400 sm:text-sm">
                  可用: ¥{{ referralInfo.balance?.toFixed(2) || 0.00 }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">收款方式</label>
            <select
              v-model="withdrawForm.method"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            >
              <option value="alipay">支付宝</option>
              <option value="wechat">微信支付</option>
              <option value="bank">银行卡</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">收款账号</label>
            <input
              v-model="withdrawForm.accountInfo"
              type="text"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="请输入收款账号"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">备注（可选）</label>
            <textarea
              v-model="withdrawForm.note"
              rows="3"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="可选备注信息"
            ></textarea>
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="withdrawLoading || withdrawForm.amount <= 0 || !withdrawForm.accountInfo"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {{ withdrawLoading ? '提交中…' : '提交申请' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 提现记录 -->
    <div v-if="activeTab === 'withdrawRecords'" class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">提现记录</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">申请时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">金额</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">收款方式</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">状态</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">备注</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            <tr v-for="record in withdrawalRecords" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ formatDate(record.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ¥{{ record.amount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ record.method === 'alipay' ? '支付宝' : record.method === 'wechat' ? '微信支付' : '银行卡' }}
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
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ record.adminNote || record.note || '-' }}
              </td>
            </tr>
            <tr v-if="withdrawalRecords.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                暂无提现记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, formatDate } from '@/utils/tools'
import { getReferralInfoApi, getReferralRecordsApi, getReferralWithdrawalsApi, createWithdrawRequestApi } from '@/utils/http_apis'

const activeTab = ref('records')
const referralInfo = ref({})
const commissionRecords = ref([])
const withdrawalRecords = ref([])
const totalCommission = ref(0)
const withdrawLoading = ref(false)
const withdrawForm = ref({
  amount: 0,
  method: 'alipay',
  accountInfo: '',
  note: ''
})

const referralLink = ref('')

const loadReferralInfo = async () => {
  try {
    const data = await getReferralInfoApi()
    referralInfo.value = data
    referralLink.value = `${window.location.origin}/user/register?ref=${data.code}`
  } catch (error) {
    showToast('加载推广信息失败', 'error')
  }
}

const loadCommissionRecords = async () => {
  try {
    const { records } = await getReferralRecordsApi({ limit: 100 })
    commissionRecords.value = records
    totalCommission.value = records
      .filter(r => r.direction === 'credit' && r.type === 'commission')
      .reduce((sum, r) => sum + r.amount, 0)
  } catch (error) {
    showToast('加载返佣记录失败', 'error')
  }
}

const loadWithdrawalRecords = async () => {
  try {
    const { requests } = await getReferralWithdrawalsApi({ limit: 100 })
    withdrawalRecords.value = requests
  } catch (error) {
    showToast('加载提现记录失败', 'error')
  }
}

const copyReferralLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    showToast('推广链接已复制到剪贴板', 'success')
  } catch {
    showToast('复制失败，请手动复制', 'error')
  }
}

const submitWithdraw = async () => {
  if (withdrawForm.amount <= 0) {
    showToast('请输入正确的提现金额', 'error')
    return
  }
  if (withdrawForm.amount > referralInfo.value.balance) {
    showToast('提现金额超过可用余额', 'error')
    return
  }
  if (!withdrawForm.accountInfo) {
    showToast('请填写收款账号', 'error')
    return
  }

  withdrawLoading.value = true
  try {
    await createWithdrawRequestApi(withdrawForm.value)
    showToast('提现申请提交成功，请等待管理员审核', 'success')
    withdrawForm.value = { amount: 0, method: 'alipay', accountInfo: '', note: '' }
    await Promise.all([loadReferralInfo(), loadWithdrawalRecords()])
  } catch (error) {
    showToast(error.response?.data?.message || '提交失败', 'error')
  } finally {
    withdrawLoading.value = false
  }
}

onMounted(() => {
  loadReferralInfo()
  loadCommissionRecords()
  loadWithdrawalRecords()
})
</script>
