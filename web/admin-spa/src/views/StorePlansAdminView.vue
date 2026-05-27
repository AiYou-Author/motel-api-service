<template>
  <div class="tab-content">
    <div class="card p-4 sm:p-6">
      <!-- Header -->
      <div class="mb-4 flex flex-col gap-4 sm:mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100 sm:mb-2 sm:text-xl">
              商城套餐
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              统一编辑全部套餐（含已停用），保存时全量替换
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              title="当前数据版本（每次保存自增）"
            >
              <i class="fas fa-code-branch mr-1.5 opacity-60" />
              version {{ version }}
            </span>
            <button class="btn-secondary" :disabled="loading" @click="loadPlans">
              <i class="fas fa-sync-alt mr-1.5" :class="{ 'animate-spin': loading }" />
              刷新
            </button>
            <button class="btn-secondary" :disabled="loading" @click="openCreate">
              <i class="fas fa-plus mr-1.5" />
              新建
            </button>
            <button class="btn-primary" :disabled="loading || saving" @click="saveAll">
              <i class="fas fa-save mr-1.5" :class="{ 'animate-spin': saving }" />
              保存全部
            </button>
          </div>
        </div>
      </div>

      <!-- 列表 -->
      <div v-if="sortedPlans.length === 0" class="py-12 text-center text-gray-500">
        暂无套餐，点击「新建」开始添加
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(plan, idx) in sortedPlans"
          :key="plan.id || idx"
          class="flex items-center justify-between rounded-lg border p-4 transition hover:shadow-sm"
          :class="
            plan.enabled
              ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              : 'border-dashed border-gray-300 bg-gray-50 opacity-70 dark:border-gray-600 dark:bg-gray-900'
          "
        >
          <div class="flex items-center gap-3">
            <span
              v-if="plan.badge"
              class="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              :style="{ backgroundColor: plan.badgeColor || '#6b7280' }"
            >
              {{ plan.badge }}
            </span>
            <div>
              <div class="font-semibold text-gray-900 dark:text-gray-100">
                {{ plan.name || '(未命名)' }}
                <span class="ml-2 text-xs text-gray-500">#{{ plan.id }}</span>
              </div>
              <div class="mt-0.5 text-xs text-gray-500">
                {{ plan.channel }} · {{ plan.accountType }} · ¥{{ plan.price ?? 0 }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-secondary !py-1 !text-xs" @click="openEdit(plan)">
              <i class="fas fa-pen mr-1" />编辑
            </button>
            <button
              class="btn-secondary !py-1 !text-xs"
              :class="plan.enabled ? 'text-red-600' : 'text-green-600'"
              @click="toggleEnabled(plan)"
            >
              <i class="mr-1" :class="plan.enabled ? 'fas fa-ban' : 'fas fa-check'" />
              {{ plan.enabled ? '停用' : '启用' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeEditor"
    >
      <div
        class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h4 class="mb-4 text-lg font-bold">{{ isCreating ? '新建套餐' : '编辑套餐' }}</h4>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="form-label">ID *</label>
            <input
              v-model="draft.id"
              class="form-input"
              :disabled="!isCreating"
              placeholder="唯一标识"
            />
          </div>
          <div>
            <label class="form-label">名称 *</label>
            <input v-model="draft.name" class="form-input" />
          </div>
          <div>
            <label class="form-label">渠道 *</label>
            <select v-model="draft.channel" class="form-input">
              <option value="claude-code">claude-code</option>
              <option value="codex">codex</option>
              <option value="minimax">minimax</option>
            </select>
          </div>
          <div>
            <label class="form-label">accountType *</label>
            <input v-model="draft.accountType" class="form-input" />
          </div>
          <div>
            <label class="form-label">目标账户分组 *</label>
            <select v-model="draft.targetGroupId" class="form-input">
              <option value="">-- 请选择 --</option>
              <option v-for="g in accountGroups" :key="g.id" :value="g.id">
                {{ g.name }}（{{ g.platform }}）
              </option>
            </select>
          </div>
          <div>
            <label class="form-label">套餐类型</label>
            <input
              v-model="draft.planType"
              class="form-input"
              placeholder="例如 monthly / credit"
            />
          </div>
          <div>
            <label class="form-label">价格(¥)</label>
            <input v-model.number="draft.price" class="form-input" min="0" type="number" />
          </div>
          <div>
            <label class="form-label">积分(USD)</label>
            <input v-model.number="draft.creditUSD" class="form-input" min="0" type="number" />
          </div>
          <div>
            <label class="form-label">服务费率</label>
            <input
              v-model.number="draft.serviceRate"
              class="form-input"
              min="0"
              step="0.01"
              type="number"
            />
          </div>
          <div>
            <label class="form-label">Token 限额</label>
            <input v-model.number="draft.tokenLimit" class="form-input" min="0" type="number" />
          </div>
          <div>
            <label class="form-label">徽章文案</label>
            <input v-model="draft.badge" class="form-input" />
          </div>
          <div>
            <label class="form-label">徽章颜色</label>
            <input v-model="draft.badgeColor" class="form-input h-10 p-1" type="color" />
          </div>
        </div>

        <!-- permissions -->
        <div class="mt-4">
          <label class="form-label">权限 permissions *</label>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="p in availablePermissions"
              :key="p"
              class="inline-flex items-center text-sm"
            >
              <input
                :checked="draft.permissions?.includes(p)"
                class="mr-1.5"
                type="checkbox"
                :value="p"
                @change="togglePermission(p, $event.target.checked)"
              />
              {{ p }}
            </label>
          </div>
        </div>

        <!-- models multi-select -->
        <div class="mt-4">
          <label class="form-label">模型 models *</label>
          <!-- 已选模型标签 -->
          <div v-if="draft.models && draft.models.length" class="mb-2 flex flex-wrap gap-1.5">
            <span
              v-for="m in draft.models"
              :key="m"
              class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ m }}
              <button
                class="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                type="button"
                @click="removeModel(m)"
              >
                ×
              </button>
            </span>
          </div>
          <div v-else class="mb-2 text-xs text-gray-400">暂无已选模型</div>
          <!-- 添加模型下拉框 -->
          <select class="form-input" @change="addModel($event)">
            <option value="">+ 添加模型...</option>
            <option v-for="m in unselectedModels" :key="m" :value="m">
              {{ m }}
            </option>
          </select>
        </div>

        <!-- description / features -->
        <div class="mt-4">
          <label class="form-label">描述</label>
          <textarea v-model="draft.description" class="form-input" rows="2" />
        </div>
        <div class="mt-4">
          <label class="form-label">功能列表 features（逗号分隔）</label>
          <input v-model="featuresInput" class="form-input" placeholder="特性1, 特性2" />
        </div>

        <div class="mt-4">
          <label class="inline-flex items-center text-sm">
            <input v-model="draft.enabled" class="mr-1.5" type="checkbox" />
            启用
          </label>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button class="btn-secondary" @click="closeEditor">取消</button>
          <button class="btn-primary" @click="commitDraft">确定</button>
        </div>
      </div>
    </div>

    <!-- 版本冲突弹窗 -->
    <div
      v-if="conflictOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h4 class="mb-3 text-lg font-bold text-red-600">版本冲突</h4>
        <p class="text-sm text-gray-700 dark:text-gray-200">
          已有其他管理员保存。当前服务器版本：{{ conflictVersion }}，本地版本：{{ version }}。
          是否重新拉取最新数据？（您当前的编辑将被丢弃）
        </p>
        <div class="mt-6 flex justify-end gap-2">
          <button class="btn-secondary" @click="conflictOpen = false">取消</button>
          <button
            class="btn-primary"
            @click="
              () => {
                conflictOpen = false
                loadPlans()
              }
            "
          >
            重新拉取
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getAdminPlansApi,
  saveAdminPlansApi,
  getAccountGroupsApi,
  getModelPricingApi,
  getCustomPricingApi
} from '@/utils/http_apis'
import { showToast } from '@/utils/tools'

const loading = ref(false)
const saving = ref(false)
const plans = ref([])
const version = ref(0)
const accountGroups = ref([])
const availableModels = ref([])
const availablePermissions = ['claude', 'gemini', 'openai', 'codex']

const editing = ref(false)
const isCreating = ref(false)
const draft = ref({})
const editingIndex = ref(-1)
const featuresInput = ref('')

const conflictOpen = ref(false)
const conflictVersion = ref(0)

const sortedPlans = computed(() =>
  [...plans.value].sort((a, b) => {
    if (a.enabled === b.enabled) return 0
    return a.enabled ? -1 : 1
  })
)

const loadPlans = async () => {
  loading.value = true
  try {
    const res = await getAdminPlansApi()
    if (res?.success) {
      plans.value = Array.isArray(res.plans) ? res.plans : []
      version.value = Number.isInteger(res.version) ? res.version : 0
    } else {
      showToast(res?.error || '加载套餐失败', 'error')
    }
  } catch (e) {
    showToast(e?.message || '加载套餐失败', 'error')
  } finally {
    loading.value = false
  }
}

const loadGroups = async () => {
  try {
    const res = await getAccountGroupsApi()
    if (res?.success) {
      accountGroups.value = res.data || []
    }
  } catch (e) {
    showToast('账户分组加载失败', 'error')
  }
}

const loadModels = async () => {
  try {
    const set = new Set()
    const [pricingRes, customRes] = await Promise.all([
      getModelPricingApi().catch(() => null),
      getCustomPricingApi().catch(() => null)
    ])
    if (pricingRes?.success && pricingRes.data) {
      Object.keys(pricingRes.data).forEach((m) => set.add(m))
    }
    if (customRes?.success && Array.isArray(customRes.data)) {
      customRes.data.forEach((c) => c.model && set.add(c.model))
    }
    availableModels.value = [...set].sort()
  } catch (e) {
    showToast('模型列表加载失败', 'error')
  }
}

const blankPlan = () => ({
  id: '',
  name: '',
  channel: 'claude-code',
  accountType: '',
  permissions: [],
  targetGroupId: '',
  planType: '',
  price: 0,
  creditUSD: 0,
  serviceRate: 0,
  tokenLimit: 0,
  models: [],
  badge: '',
  badgeColor: '#6b7280',
  description: '',
  features: [],
  enabled: true
})

const openCreate = () => {
  draft.value = blankPlan()
  featuresInput.value = ''
  editingIndex.value = -1
  isCreating.value = true
  editing.value = true
}

const openEdit = (plan) => {
  const idx = plans.value.findIndex((p) => p === plan)
  draft.value = JSON.parse(JSON.stringify(plan))
  if (!draft.value.permissions) draft.value.permissions = []
  if (!draft.value.models) draft.value.models = []
  if (!draft.value.features) draft.value.features = []
  featuresInput.value = (draft.value.features || []).join(', ')
  editingIndex.value = idx
  isCreating.value = false
  editing.value = true
}

const closeEditor = () => {
  editing.value = false
  draft.value = {}
}

const togglePermission = (p, checked) => {
  const set = new Set(draft.value.permissions || [])
  if (checked) set.add(p)
  else set.delete(p)
  draft.value.permissions = [...set]
}

// 未选择的模型列表（用于下拉框）
const unselectedModels = computed(() => {
  const selected = new Set(draft.value.models || [])
  return availableModels.value.filter((m) => !selected.has(m))
})

const addModel = (e) => {
  const val = e.target.value
  if (!val) return
  if (!draft.value.models) draft.value.models = []
  if (!draft.value.models.includes(val)) {
    draft.value.models.push(val)
  }
  e.target.value = '' // 重置下拉框
}

const removeModel = (m) => {
  if (!draft.value.models) return
  draft.value.models = draft.value.models.filter((x) => x !== m)
}

const commitDraft = () => {
  const d = draft.value
  if (!d.id) return showToast('id 必填', 'error')
  if (!d.name) return showToast('名称必填', 'error')
  if (isCreating.value && plans.value.some((p) => p.id === d.id)) {
    return showToast('id 已存在', 'error')
  }
  d.features = featuresInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (isCreating.value) {
    plans.value.push(d)
  } else if (editingIndex.value >= 0) {
    plans.value.splice(editingIndex.value, 1, d)
  }
  closeEditor()
}

const toggleEnabled = (plan) => {
  const idx = plans.value.findIndex((p) => p === plan)
  if (idx >= 0) {
    plans.value.splice(idx, 1, { ...plan, enabled: !plan.enabled })
  }
}

const saveAll = async () => {
  saving.value = true
  try {
    const res = await saveAdminPlansApi(plans.value, version.value)
    if (res?.success) {
      plans.value = res.plans || plans.value
      version.value = res.version
      showToast('保存成功', 'success')
    } else {
      const details = Array.isArray(res?.details) ? '\n' + res.details.join('\n') : ''
      showToast((res?.error || '保存失败') + details, 'error')
    }
  } catch (e) {
    const status = e?.response?.status
    const data = e?.response?.data
    if (status === 409) {
      conflictVersion.value = data?.currentVersion ?? -1
      conflictOpen.value = true
    } else if (status === 400) {
      const details = Array.isArray(data?.details) ? '\n' + data.details.join('\n') : ''
      showToast((data?.error || '校验失败') + details, 'error')
    } else {
      showToast(e?.message || '保存失败', 'error')
    }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadPlans(), loadGroups(), loadModels()])
})
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50;
}
.btn-secondary {
  @apply inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600;
}
.form-label {
  @apply mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400;
}
.form-input {
  @apply w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100;
}
</style>
