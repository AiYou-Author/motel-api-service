<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4"
    @click.self="onClose"
  >
    <div
      class="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-base font-semibold text-gray-900 dark:text-white">
              {{ order?.planName || '订单详情' }}
            </h3>
            <span :class="statusBadge(order?.status)">{{ statusLabel(order?.status) }}</span>
          </div>
          <p class="mt-0.5 truncate font-mono text-[11px] text-gray-400 dark:text-gray-500">
            #{{ order?.orderId }}
          </p>
        </div>
        <button
          class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          @click="onClose"
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

      <!-- Hero: 三个核心指标 -->
      <div
        v-if="order?.status === 'approved'"
        class="grid grid-cols-3 gap-px border-b border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700"
      >
        <HeroMetric
          accent="blue"
          :hint="totalCostLimit > 0 ? `上限 $${totalCostLimit.toFixed(2)}` : '无限制'"
          label="剩余额度"
          :ratio="usageRatio"
          unit="$"
          :value="remainingCost"
        />
        <HeroMetric
          accent="purple"
          :hint="`${(usageRatio * 100).toFixed(1)}% 已用`"
          label="累计消耗"
          :ratio="usageRatio"
          unit="$"
          :value="totalCost"
        />
        <HeroMetric
          accent="green"
          :hint="dailyCostLimit > 0 ? `今日上限 $${dailyCostLimit.toFixed(2)}` : '无日限'"
          label="今日消耗"
          :ratio="dailyRatio"
          unit="$"
          :value="dailyCost"
        />
      </div>
      <div
        v-else
        class="border-b border-gray-200 bg-gray-50 px-6 py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {{ statusHeroHint }}
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 px-6 dark:border-gray-700">
        <nav class="-mb-px flex gap-6">
          <button
            v-for="t in availableTabs"
            :key="t.key"
            class="border-b-2 px-1 py-2 text-sm transition-colors"
            :class="
              activeTab === t.key
                ? 'border-blue-500 font-medium text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </button>
        </nav>
      </div>

      <!-- Body -->
      <div
        :class="
          activeTab === 'test' ? 'flex min-h-0 flex-1 flex-col' : 'flex-1 overflow-y-auto px-6 py-4'
        "
      >
        <!-- Tab: 订单信息 -->
        <div v-if="activeTab === 'order'" class="space-y-3">
          <Row label="状态">
            <span :class="statusBadge(order?.status)">{{ statusLabel(order?.status) }}</span>
          </Row>
          <Row label="渠道">{{ order?.channel || '—' }}</Row>
          <Row label="付款金额">¥{{ order?.amount ?? '—' }}</Row>
          <Row v-if="order?.serviceRate" label="服务倍率">{{ order.serviceRate }}x</Row>
          <Row label="创建时间">{{ formatTime(order?.createdAt) }}</Row>
          <Row v-if="order?.status === 'approved'" label="审批时间">
            {{ formatTime(order?.updatedAt) }}
          </Row>
          <Row v-if="order?.contactInfo" label="联系方式">{{ order.contactInfo }}</Row>
          <Row v-if="order?.remark" label="管理员备注">{{ order.remark }}</Row>
        </div>

        <!-- Tab: API Key -->
        <div v-else-if="activeTab === 'key'" class="space-y-3">
          <div v-if="loadingKey" class="py-8 text-center text-sm text-gray-400">加载中…</div>
          <template v-else-if="keyInfo">
            <Row label="名称">{{ keyInfo.name || '—' }}</Row>
            <Row label="状态">
              <span
                :class="
                  keyInfo.isActive
                    ? 'rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                "
              >
                {{ keyInfo.isActive ? '启用' : '已停用' }}
              </span>
            </Row>
            <Row label="有效期">{{
              keyInfo.expiresAt ? formatTime(keyInfo.expiresAt) : '永久'
            }}</Row>
            <Row label="最近使用">{{
              keyInfo.lastUsedAt ? formatTime(keyInfo.lastUsedAt) : '从未使用'
            }}</Row>
            <div class="pt-1">
              <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">API Key</div>
              <div
                class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <code class="flex-1 truncate font-mono text-xs text-gray-700 dark:text-gray-200">
                  {{ keyVisible ? order?.apiKeyValue : maskedKey }}
                </code>
                <button
                  class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  @click="keyVisible = !keyVisible"
                >
                  {{ keyVisible ? '隐藏' : '显示' }}
                </button>
                <button
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  @click="copyKey"
                >
                  复制
                </button>
              </div>
            </div>
          </template>
          <div v-else class="py-8 text-center text-sm text-gray-400">暂无 API Key 信息</div>
        </div>

        <!-- Tab: 用量明细 -->
        <div v-else-if="activeTab === 'usage'" class="space-y-3">
          <div v-if="loadingKey" class="py-8 text-center text-sm text-gray-400">加载中…</div>
          <template v-else-if="keyInfo">
            <Row label="调用次数">{{ formatNum(keyInfo.usage?.total?.requests) }}</Row>
            <Row label="输入 token">{{ formatNum(keyInfo.usage?.total?.inputTokens) }}</Row>
            <Row label="输出 token">{{ formatNum(keyInfo.usage?.total?.outputTokens) }}</Row>
            <Row v-if="tokenLimit > 0" label="累计 token">
              {{ formatNum(totalTokens) }}
              <span class="text-gray-400">/ {{ formatNum(tokenLimit) }}</span>
            </Row>
            <Row label="今日消耗">${{ dailyCost.toFixed(4) }}</Row>
            <Row label="今日 token">{{
              formatNum(
                (keyInfo.usage?.daily?.inputTokens || 0) + (keyInfo.usage?.daily?.outputTokens || 0)
              )
            }}</Row>
          </template>
          <div v-else class="py-8 text-center text-sm text-gray-400">暂无用量数据</div>
        </div>

        <!-- Tab: 自测 -->
        <ApiKeyTestPanel
          v-else-if="activeTab === 'test'"
          :active="show && activeTab === 'test'"
          :order="order"
        />
      </div>

      <!-- Confirm Delete Overlay -->
      <div
        v-if="confirmingDelete"
        class="border-t border-red-200 bg-red-50 px-6 py-3 dark:border-red-700/50 dark:bg-red-900/20"
      >
        <div class="text-sm font-medium text-red-700 dark:text-red-300">
          ⚠️ 确认要删除此订单吗？
        </div>
        <p class="mt-1 text-xs leading-relaxed text-red-600 dark:text-red-200">
          {{ deleteWarningText }}
        </p>
        <div class="mt-2 flex justify-end gap-2">
          <button
            class="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            :disabled="deleting"
            @click="confirmingDelete = false"
          >
            取消
          </button>
          <button
            class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
            :disabled="deleting"
            @click="doDelete"
          >
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-900"
      >
        <button
          v-if="canDelete && !confirmingDelete"
          class="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
          @click="confirmingDelete = true"
        >
          {{ deleteButtonText }}
        </button>
        <span v-else />
        <button
          class="rounded-md bg-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          @click="onClose"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { deleteOrderApi } from '@/utils/http_apis'
import { showToast, formatDate, formatNumber, copyText } from '@/utils/tools'
import ApiKeyTestPanel from './ApiKeyTestPanel.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null }
})
const emit = defineEmits(['close', 'deleted'])

const userStore = useUserStore()
const keyInfo = ref(null)
const loadingKey = ref(false)
const confirmingDelete = ref(false)
const deleting = ref(false)
const activeTab = ref('order')
const keyVisible = ref(false)

watch(
  () => props.show,
  async (v) => {
    if (!v) {
      keyInfo.value = null
      confirmingDelete.value = false
      activeTab.value = 'order'
      keyVisible.value = false
      return
    }
    if (props.order?.apiKeyId) {
      loadingKey.value = true
      try {
        const keys = await userStore.getUserApiKeys(true)
        keyInfo.value = (keys || []).find((k) => k.id === props.order.apiKeyId) || null
      } catch (_e) {
        keyInfo.value = null
      } finally {
        loadingKey.value = false
      }
    }
  }
)

// Hero 圆环指标
const HeroMetric = (props) => {
  const ratio = Math.max(0, Math.min(1, Number(props.ratio) || 0))
  const accentMap = {
    blue: { ring: 'stroke-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    purple: { ring: 'stroke-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    green: { ring: 'stroke-green-500', text: 'text-green-600 dark:text-green-400' }
  }
  const accent = accentMap[props.accent] || accentMap.blue
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c * (1 - ratio)
  const value = Number(props.value) || 0
  return h(
    'div',
    {
      class: 'flex items-center gap-3 bg-white px-4 py-3 dark:bg-gray-800'
    },
    [
      h('div', { class: 'relative h-12 w-12 shrink-0' }, [
        h('svg', { class: 'h-12 w-12 -rotate-90', viewBox: '0 0 50 50' }, [
          h('circle', {
            cx: 25,
            cy: 25,
            r,
            class: 'fill-none stroke-gray-200 dark:stroke-gray-700',
            'stroke-width': 4
          }),
          h('circle', {
            cx: 25,
            cy: 25,
            r,
            class: `fill-none ${accent.ring}`,
            'stroke-width': 4,
            'stroke-linecap': 'round',
            'stroke-dasharray': c,
            'stroke-dashoffset': offset
          })
        ])
      ]),
      h('div', { class: 'min-w-0 flex-1' }, [
        h('div', { class: 'truncate text-[11px] text-gray-500 dark:text-gray-400' }, props.label),
        h(
          'div',
          { class: `truncate text-base font-semibold ${accent.text}` },
          `${props.unit}${value.toFixed(2).replace(/\.00$/, '')}`
        ),
        h('div', { class: 'truncate text-[10px] text-gray-400 dark:text-gray-500' }, props.hint)
      ])
    ]
  )
}
HeroMetric.props = ['label', 'value', 'ratio', 'unit', 'accent', 'hint']

// 信息行
const Row = (_, { slots, attrs }) =>
  h(
    'div',
    {
      class:
        'flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0 dark:border-gray-700/50'
    },
    [
      h('span', { class: 'shrink-0 text-xs text-gray-500 dark:text-gray-400' }, attrs.label),
      h(
        'span',
        { class: 'min-w-0 break-all text-right text-sm text-gray-900 dark:text-gray-100' },
        slots.default ? slots.default() : ''
      )
    ]
  )
Row.props = ['label']

// computed: 用量数据
const totalCost = computed(() => Number(keyInfo.value?.totalCost) || 0)
const totalCostLimit = computed(() => Number(keyInfo.value?.totalCostLimit) || 0)
const dailyCost = computed(() => Number(keyInfo.value?.dailyCost) || 0)
const dailyCostLimit = computed(() => Number(keyInfo.value?.dailyCostLimit) || 0)
const totalTokens = computed(() => {
  const t = keyInfo.value?.usage?.total
  return (Number(t?.inputTokens) || 0) + (Number(t?.outputTokens) || 0)
})
const tokenLimit = computed(() => Number(keyInfo.value?.tokenLimit) || 0)
const remainingCost = computed(() =>
  totalCostLimit.value > 0 ? Math.max(0, totalCostLimit.value - totalCost.value) : 0
)
const usageRatio = computed(() =>
  totalCostLimit.value > 0 ? totalCost.value / totalCostLimit.value : 0
)
const dailyRatio = computed(() =>
  dailyCostLimit.value > 0 ? dailyCost.value / dailyCostLimit.value : 0
)

const maskedKey = computed(() => {
  const v = props.order?.apiKeyValue
  if (!v) return ''
  return v.length > 16 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v
})

const availableTabs = computed(() => {
  const list = [{ key: 'order', label: '订单信息' }]
  if (props.order?.apiKeyValue) list.push({ key: 'key', label: 'API Key' })
  if (props.order?.status === 'approved') list.push({ key: 'usage', label: '用量明细' })
  if (props.order?.status === 'approved' && props.order?.apiKeyValue) {
    list.push({ key: 'test', label: '自测' })
  }
  return list
})

const canDelete = computed(() => {
  const s = props.order?.status
  return s === 'pending' || s === 'rejected' || s === 'approved'
})

const deleteButtonText = computed(() => {
  const s = props.order?.status
  if (s === 'pending') return '撤销订单'
  if (s === 'rejected') return '删除记录'
  if (s === 'approved') return '放弃服务并删除'
  return '删除'
})

const deleteWarningText = computed(() => {
  const s = props.order?.status
  if (s === 'pending') return '撤销后订单作废且不可恢复，是否继续？'
  if (s === 'rejected') return '该记录将从你的列表中隐藏，操作不可逆。'
  return '订单删除后无法恢复，已生成的 API Key 将立即停用。若已完成线下支付，款项不予退还。请确认后操作。'
})

const statusHeroHint = computed(() => {
  const s = props.order?.status
  if (s === 'pending') return '订单审批中，审批通过后将在此显示用量与额度'
  if (s === 'rejected') return '订单已被拒绝，未生成 API Key'
  if (s === 'cancelled') return '订单已撤销'
  return '暂无可用数据'
})

function statusLabel(s) {
  return (
    {
      pending: '待审批',
      approved: '已通过',
      rejected: '已拒绝',
      cancelled: '已撤销'
    }[s] ||
    s ||
    '—'
  )
}

function statusBadge(s) {
  const base = 'rounded px-1.5 py-0.5 text-[11px] '
  const map = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }
  return base + (map[s] || 'bg-gray-100 text-gray-600')
}

function formatTime(t) {
  if (!t) return '—'
  try {
    return formatDate(t)
  } catch {
    return t
  }
}

function formatNum(n) {
  if (n == null) return '—'
  try {
    return formatNumber(n)
  } catch {
    return String(n)
  }
}

function onClose() {
  if (deleting.value) return
  emit('close')
}

async function copyKey() {
  await copyText(props.order.apiKeyValue, '已复制到剪贴板')
}

async function doDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await deleteOrderApi(props.order.orderId)
    showToast('订单已删除', 'success')
    emit('deleted', props.order.orderId)
    emit('close')
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || '删除失败'
    showToast(msg, 'error')
  } finally {
    deleting.value = false
  }
}
</script>
