<template>
  <div>
    <!-- 标题 -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
        选择适合你的 订阅套餐
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        通过支付购买或兑换码激活获取订阅服务
      </p>
    </div>

    <!-- Tab 切换 -->
    <div class="mb-8 flex justify-center">
      <div class="inline-flex rounded-full bg-gray-100 p-1 dark:bg-gray-800">
        <button
          :class="[
            'rounded-full px-6 py-2 text-sm font-medium transition-all',
            activeTab === 'payg'
              ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
          @click="activeTab = 'payg'"
        >
          按量付费
        </button>
        <button
          :class="[
            'rounded-full px-6 py-2 text-sm font-medium transition-all',
            activeTab === 'monthly'
              ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
          @click="activeTab = 'monthly'"
        >
          包月套餐
        </button>
      </div>
    </div>

    <!-- 按量付费 -->
    <template v-if="activeTab === 'payg'">
      <div
        class="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 dark:border-blue-900/40 dark:bg-blue-950/30"
      >
        <p class="text-sm font-medium text-gray-800 dark:text-gray-200">按量付费模式</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          无需订阅，充值即用，按实际消耗扣费。余额所有渠道通用，可自由切换。
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <svg class="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="plan in paygPlans"
          :key="plan.id"
          class="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <div>
              <span
                :class="[
                  'inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                  plan.badgeColor === 'green'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                ]"
                >{{ plan.badge }}</span
              >
              <h3 class="mt-1.5 text-base font-bold text-gray-900 dark:text-white">
                {{ plan.name }}
              </h3>
            </div>
            <div class="shrink-0 rounded-lg bg-gray-50 px-2.5 py-1.5 text-right dark:bg-gray-700">
              <p class="text-xs text-gray-400 dark:text-gray-500">当前倍率</p>
              <p class="text-sm font-bold text-gray-800 dark:text-white">
                1 : <span class="text-blue-600 dark:text-blue-400">{{ plan.serviceRate }}</span>
              </p>
            </div>
          </div>

          <p class="mb-2 text-xs text-gray-400 dark:text-gray-500">
            1元可用约<span class="font-semibold text-gray-600 dark:text-gray-300">{{
              (1 / plan.serviceRate).toFixed(2)
            }}</span
            >美元额度
          </p>

          <p v-if="plan.description" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
            {{ plan.description }}
          </p>

          <div class="mb-3">
            <p class="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              支持模型
              <span class="font-normal text-gray-400">（每百万 token 价格）</span>
            </p>
            <div class="space-y-1">
              <div
                v-for="m in plan.models"
                :key="m"
                class="flex items-center justify-between gap-2 rounded bg-gray-100 px-2 py-1 text-[11px] dark:bg-gray-700"
              >
                <span class="shrink-0 font-medium text-gray-700 dark:text-gray-200">{{ m }}</span>
                <span
                  v-if="getModelPrice(m, plan.serviceRate)"
                  class="shrink-0 whitespace-nowrap text-gray-500 dark:text-gray-400"
                  >入 ${{ getModelPrice(m, plan.serviceRate).input || '-' }} / 出 ${{
                    getModelPrice(m, plan.serviceRate).output || '-'
                  }}</span
                >
                <span v-else class="shrink-0 whitespace-nowrap text-gray-400">价格未知</span>
              </div>
            </div>
          </div>

          <div v-if="plan.features && plan.features.length" class="mb-3">
            <p class="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">功能特性</p>
            <ul class="space-y-1">
              <li
                v-for="f in plan.features"
                :key="f"
                class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"
              >
                <svg
                  class="h-3.5 w-3.5 shrink-0 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                  />
                </svg>
                {{ f }}
              </li>
            </ul>
          </div>

          <div v-if="plan.warnings && plan.warnings.length" class="mb-3">
            <p
              v-for="w in plan.warnings"
              :key="w"
              class="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400"
            >
              <span class="shrink-0">⚠️</span>{{ w }}
            </p>
          </div>

          <div class="mt-auto pt-3">
            <button
              class="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95"
              @click="openRechargeModal(plan)"
            >
              立即充值
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-600 dark:bg-gray-800"
      >
        <p class="text-2xl">🚀</p>
        <p class="mt-3 text-base font-semibold text-gray-700 dark:text-gray-300">
          包月套餐即将上线
        </p>
        <p class="mt-1 text-sm text-gray-400">敬请期待</p>
      </div>
    </template>

    <!-- 购买流程 -->
    <div class="mt-14">
      <h2 class="mb-6 text-center text-lg font-bold text-gray-900 dark:text-white">购买流程</h2>
      <p class="mb-8 text-center text-sm text-gray-500 dark:text-gray-400">
        简单四步，快速开启 AI 服务
      </p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="step in steps" :key="step.no" class="flex flex-col items-center text-center">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl dark:bg-blue-900/40"
          >
            {{ step.icon }}
          </div>
          <p class="mt-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
            {{ step.title }}
          </p>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ step.desc }}</p>
        </div>
      </div>
    </div>

    <p class="mt-10 text-center text-xs text-gray-400 dark:text-gray-500">
      * 上述套餐价格与权益请以控制台「订阅」页面与官方公告为准。如有问题请联系客服。
    </p>

    <!-- 充值弹窗 -->
    <Teleport to="body">
      <div
        v-if="modal.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="closeModal"
      >
        <div class="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
          <div
            class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700"
          >
            <div>
              <span
                :class="[
                  'mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                  modal.plan?.badgeColor === 'green'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                ]"
                >{{ modal.plan?.badge }}</span
              >
              <span class="font-bold text-gray-900 dark:text-white">{{ modal.plan?.name }}</span>
              <span class="ml-2 text-sm text-gray-400">倍率 1:{{ modal.plan?.serviceRate }}</span>
            </div>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              @click="closeModal"
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

          <div v-if="modal.step === 1" class="px-6 py-5">
            <p class="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">选择充值金额</p>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="amt in rechargeAmounts"
                :key="amt"
                :class="[
                  'flex flex-col items-center rounded-xl border-2 py-3 transition-all',
                  modal.selectedAmount === amt
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                ]"
                @click="modal.selectedAmount = amt"
              >
                <span class="text-base font-bold text-gray-900 dark:text-white">¥{{ amt }}</span>
                <span class="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                  ≈ ${{ (amt / modal.plan.serviceRate).toFixed(2) }}
                </span>
              </button>
            </div>

            <div
              v-if="modal.selectedAmount"
              class="mt-4 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50"
            >
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">充值金额</span>
                <span class="font-semibold text-gray-900 dark:text-white"
                  >¥{{ modal.selectedAmount }}</span
                >
              </div>
              <div class="mt-1 flex justify-between text-sm">
                <span class="text-gray-500 dark:text-gray-400">获得 USD 额度</span>
                <span class="font-semibold text-blue-600 dark:text-blue-400">
                  ${{ (modal.selectedAmount / modal.plan.serviceRate).toFixed(4) }}
                </span>
              </div>
            </div>

            <button
              class="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!modal.selectedAmount || modal.submitting"
              @click="submitOrder"
            >
              <span v-if="modal.submitting" class="flex items-center justify-center gap-2">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    fill="currentColor"
                  />
                </svg>
                生成订单中...
              </span>
              <span v-else>生成订单</span>
            </button>
          </div>

          <div v-else-if="modal.step === 2" class="px-6 py-5">
            <div class="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs dark:bg-gray-700/50">
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">订单号</span>
                <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{
                  modal.orderId
                }}</span>
              </div>
              <div class="mt-1.5 flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">应付金额</span>
                <span class="font-bold text-gray-900 dark:text-white"
                  >¥{{ modal.selectedAmount }}</span
                >
              </div>
              <div class="mt-1.5 flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">获得额度</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">
                  ${{ (modal.selectedAmount / modal.plan.serviceRate).toFixed(4) }} USD
                </span>
              </div>
            </div>

            <div class="mb-4 flex flex-col items-center">
              <div
                v-if="qrCodeImage"
                class="rounded-xl border border-gray-200 p-2 dark:border-gray-600"
              >
                <img alt="支付二维码" class="h-44 w-44 object-contain" :src="qrCodeImage" />
              </div>
              <div
                v-else
                class="flex h-44 w-44 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 dark:border-gray-600"
              >
                <span class="text-xs">暂无二维码</span>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">请扫码完成支付</p>
            </div>

            <div
              v-if="paymentInstructions"
              class="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            >
              {{ paymentInstructions }}
            </div>

            <!-- 支付凭证/备注输入 -->
            <div class="mb-4">
              <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                支付凭证 / 备注 <span class="text-gray-400">（选填）</span>
              </label>
              <input
                v-model="modal.paymentNote"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="请填写支付宝/微信交易单号或其他备注"
                type="text"
              />
              <p class="mt-1 text-[10px] text-gray-400">填写支付凭证有助于管理员快速核实并审批</p>
            </div>

            <button
              class="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              :disabled="modal.submittingNote"
              @click="submitPaymentNote"
            >
              <span v-if="modal.submittingNote">提交中...</span>
              <span v-else>已完成支付，提交审核</span>
            </button>
            <p class="mt-2 text-center text-xs text-gray-400">可在「我的订单」中查看审批状态</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getStorePlansApi, createOrderApi, updateOrderNoteApi } from '@/utils/http_apis'
import { showToast } from '@/utils/tools'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const allPlans = ref([])
const rechargeAmounts = ref([10, 30, 50, 100, 200, 500])
const qrCodeImage = ref(null)
const paymentInstructions = ref('')
const activeTab = ref('payg')

const isLoggedIn = computed(() => userStore.isAuthenticated)
const paygPlans = computed(() => allPlans.value.filter((p) => p.planType === 'payg' || !p.planType))

const steps = [
  { no: 1, icon: '🛍️', title: '选择套餐', desc: '根据您的使用需求，选择合适的订阅套餐' },
  { no: 2, icon: '💳', title: '完成支付', desc: '通过安全的支付渠道完成付款' },
  { no: 3, icon: '🎟️', title: '生成订单', desc: '支付成功后立即生成待审批订单' },
  { no: 4, icon: '🚀', title: '激活使用', desc: '管理员审批后 API Key 即刻可用' }
]

const modal = ref({
  open: false,
  step: 1,
  plan: null,
  selectedAmount: null,
  submitting: false,
  submittingNote: false,
  orderId: null,
  paymentNote: ''
})

function openRechargeModal(plan) {
  if (!isLoggedIn.value) {
    showToast('请先登录后再购买', 'warning')
    router.push('/user/login')

    return
  }
  modal.value = {
    open: true,
    step: 1,
    plan,
    selectedAmount: null,
    submitting: false,
    orderId: null
  }
}

function closeModal() {
  modal.value.open = false
  modal.value.paymentNote = ''
}

async function submitPaymentNote() {
  modal.value.submittingNote = true
  try {
    // 更新订单备注
    if (modal.value.orderId && modal.value.paymentNote) {
      await updateOrderNoteApi(modal.value.orderId, modal.value.paymentNote)
    }
    showToast('已提交审核，请等待管理员处理', 'success')
    closeModal()
  } catch (e) {
    showToast('提交失败: ' + (e.message || '未知错误'), 'error')
  } finally {
    modal.value.submittingNote = false
  }
}

async function submitOrder() {
  if (!modal.value.selectedAmount || modal.value.submitting) return
  modal.value.submitting = true
  try {
    const { data } = await createOrderApi(modal.value.plan.id, modal.value.selectedAmount)

    modal.value.orderId = data.order.orderId
    modal.value.step = 2
  } catch (err) {
    const msg = err.response?.data?.error || '下单失败，请稍后重试'

    showToast(msg, 'error')
  } finally {
    modal.value.submitting = false
  }
}

// 模型基础价格
const modelPricing = ref({})

// 计算模型按倍率调整后的价格（每百万 token）
function getModelPrice(modelId, serviceRate) {
  const base = modelPricing.value[modelId]

  if (!base) return null
  const rate = serviceRate ?? 1

  return {
    input: base.input != null ? (base.input * rate).toFixed(2) : null,
    output: base.output != null ? (base.output * rate).toFixed(2) : null
  }
}

onMounted(async () => {
  try {
    await userStore.checkAuth()
  } catch (e) {
    // 未登录或 token 失效，保持公开浏览
  }
  try {
    const { data } = await getStorePlansApi()

    allPlans.value = data.plans || []
    modelPricing.value = data.modelPricing || {}
    qrCodeImage.value = data.qrCodeImage || null
    paymentInstructions.value = data.paymentInstructions || ''
    rechargeAmounts.value = data.rechargeAmounts || [10, 30, 50, 100, 200, 500]
  } catch {
    showToast('加载套餐失败', 'error')
  } finally {
    loading.value = false
  }
})
</script>
