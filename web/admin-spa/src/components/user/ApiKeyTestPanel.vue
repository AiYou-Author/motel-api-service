<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Toolbar -->
    <div
      class="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <label class="flex items-center gap-1 text-gray-700 dark:text-gray-300">
        模型:
        <select
          v-model="model"
          class="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          :disabled="streaming"
        >
          <option v-for="m in modelOptions" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
      <label class="flex items-center gap-1 text-gray-700 dark:text-gray-300">
        max_tokens:
        <input
          v-model.number="maxTokens"
          class="w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          :disabled="streaming"
          max="4096"
          min="16"
          type="number"
        />
      </label>
      <button
        class="ml-auto rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        :disabled="streaming || messages.length === 0"
        @click="clearMessages"
      >
        清空对话
      </button>
    </div>

    <!-- Messages -->
    <div
      ref="messagesEl"
      class="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 py-3 dark:bg-gray-800"
    >
      <div
        v-if="messages.length === 0"
        class="mt-6 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        发送一条消息测试 API 是否通畅。
      </div>
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="[
          'rounded-lg px-3 py-2 text-sm',
          m.role === 'user'
            ? 'ml-12 bg-blue-50 text-gray-900 dark:bg-blue-900/30 dark:text-blue-100'
            : m.role === 'assistant'
              ? 'mr-12 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              : 'border border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'
        ]"
      >
        <div class="mb-1 text-xs font-medium uppercase tracking-wide opacity-60">
          {{ m.role === 'user' ? '你' : m.role === 'assistant' ? '助手' : '错误' }}
        </div>
        <div class="whitespace-pre-wrap break-words">{{ m.content || '...' }}</div>
        <div v-if="m.usage" class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
          ↑ {{ m.usage.input_tokens ?? '?' }} ↓ {{ m.usage.output_tokens ?? '?' }} tokens
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
      <div class="flex items-end gap-2">
        <textarea
          v-model="input"
          class="flex-1 resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          :disabled="streaming"
          placeholder="输入消息后按 Enter 发送（Shift+Enter 换行）"
          rows="2"
          @keydown.enter.exact.prevent="send"
        />
        <button
          class="h-10 rounded bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          :disabled="streaming || !input.trim()"
          @click="send"
        >
          <span v-if="streaming">发送中…</span>
          <span v-else>发送</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  order: { type: Object, default: null },
  // 当外层切换 tab/隐藏时，传 false 以中断流
  active: { type: Boolean, default: true }
})

const MODEL_OPTIONS_BY_CHANNEL = {
  'claude-code': ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-opus-4-1'],
  minimax: ['MiniMax-M2', 'MiniMax-M2.7'],
  codex: ['gpt-5-mini', 'gpt-5', 'gpt-4o-mini']
}

const isOpenAIChannel = computed(() => {
  const o = props.order

  if (!o) return false
  if (o.channel === 'codex') return true
  if (o.accountType === 'openai') return true
  if (Array.isArray(o.permissions) && o.permissions.includes('openai')) return true

  return false
})

const channelKey = computed(() => {
  const c = props.order?.channel

  if (c && MODEL_OPTIONS_BY_CHANNEL[c]) return c

  return isOpenAIChannel.value ? 'codex' : 'claude-code'
})

const modelOptions = computed(() => MODEL_OPTIONS_BY_CHANNEL[channelKey.value])
const model = ref(modelOptions.value[0])
const maxTokens = ref(256)
const input = ref('')
const messages = ref([])
const streaming = ref(false)
const messagesEl = ref(null)
let abortCtrl = null

watch(
  () => props.order?.orderId,
  () => {
    messages.value = []
    input.value = ''
    model.value = modelOptions.value[0]
  }
)

watch(
  () => props.active,
  (v) => {
    if (!v && abortCtrl) {
      abortCtrl.abort()
      abortCtrl = null
    }
  }
)

onBeforeUnmount(() => {
  if (abortCtrl) abortCtrl.abort()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

function clearMessages() {
  messages.value = []
}

async function send() {
  const text = input.value.trim()

  if (!text || streaming.value) return
  const apiKey = props.order?.apiKeyValue

  if (!apiKey) {
    messages.value.push({ role: 'error', content: '订单未审批通过或缺少 API Key' })

    return
  }
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  const assistantMsg = { role: 'assistant', content: '', usage: null }

  messages.value.push(assistantMsg)
  scrollToBottom()
  streaming.value = true
  abortCtrl = new AbortController()
  try {
    if (isOpenAIChannel.value) {
      await streamOpenAI(apiKey, assistantMsg)
    } else {
      await streamAnthropic(apiKey, assistantMsg)
    }
  } catch (err) {
    if (err?.name !== 'AbortError') {
      messages.value.pop()
      messages.value.push({
        role: 'error',
        content: `${err?.status || ''} ${err?.message || err}`
      })
    }
  } finally {
    streaming.value = false
    abortCtrl = null
    scrollToBottom()
  }
}

async function streamAnthropic(apiKey, assistantMsg) {
  const body = {
    model: model.value,
    max_tokens: Number(maxTokens.value) || 256,
    stream: true,
    messages: messages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .filter((m) => m !== assistantMsg)
      .map((m) => ({ role: m.role, content: m.content }))
  }
  const resp = await fetch('/api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(body),
    signal: abortCtrl.signal
  })

  if (!resp.ok) {
    const text = await resp.text()

    throw Object.assign(new Error(text || resp.statusText), { status: resp.status })
  }
  await readSSE(resp, (event) => {
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      assistantMsg.content += event.delta.text || ''
      scrollToBottom()
    } else if (event.type === 'message_delta' && event.usage) {
      assistantMsg.usage = { ...(assistantMsg.usage || {}), ...event.usage }
    } else if (event.type === 'message_start' && event.message?.usage) {
      assistantMsg.usage = { ...event.message.usage }
    }
  })
}

async function streamOpenAI(apiKey, assistantMsg) {
  const body = {
    model: model.value,
    max_tokens: Number(maxTokens.value) || 256,
    stream: true,
    stream_options: { include_usage: true },
    messages: messages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .filter((m) => m !== assistantMsg)
      .map((m) => ({ role: m.role, content: m.content }))
  }
  const resp = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      Accept: 'text/event-stream'
    },
    body: JSON.stringify(body),
    signal: abortCtrl.signal
  })

  if (!resp.ok) {
    const text = await resp.text()

    throw Object.assign(new Error(text || resp.statusText), { status: resp.status })
  }
  await readSSE(resp, (event) => {
    if (event === '[DONE]') return
    const choice = event.choices?.[0]

    if (choice?.delta?.content) {
      assistantMsg.content += choice.delta.content
      scrollToBottom()
    }
    if (event.usage) {
      assistantMsg.usage = {
        input_tokens: event.usage.prompt_tokens,
        output_tokens: event.usage.completion_tokens
      }
    }
  })
}

async function readSSE(resp, onEvent) {
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx

    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx)

      buffer = buffer.slice(idx + 2)
      const dataLines = chunk
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())

      if (dataLines.length === 0) continue
      const dataStr = dataLines.join('\n')

      if (dataStr === '[DONE]') {
        onEvent('[DONE]')
        continue
      }
      try {
        onEvent(JSON.parse(dataStr))
      } catch {
        // ignore parse errors on heartbeat / comments
      }
    }
  }
}
</script>
