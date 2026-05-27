<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <nav class="bg-white shadow dark:bg-gray-800">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex items-center">
            <div class="flex flex-shrink-0 items-center">
              <svg
                class="h-8 w-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
              <span class="ml-2 text-xl font-bold text-gray-900 dark:text-white">Motel</span>
            </div>
            <div class="ml-10">
              <div class="flex items-baseline space-x-4">
                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('overview')"
                >
                  概览
                </button>

                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'usage'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('usage')"
                >
                  用量统计
                </button>
                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'orders'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('orders')"
                >
                  我的订单
                </button>
                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'store'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('store')"
                >
                  商店
                </button>
                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'tutorial'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('tutorial')"
                >
                  教程
                </button>
                <button
                  :class="[
                    'rounded-md px-3 py-2 text-sm font-medium',
                    activeTab === 'account'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  ]"
                  @click="handleTabChange('account')"
                >
                  账户
                </button>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              欢迎，<span class="font-medium">{{ userStore.userName }}</span>
            </div>

            <!-- 主题切换按钮 -->
            <ThemeToggle mode="icon" />

            <button
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              @click="handleLogout"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容 -->
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Transition mode="out-in" name="tab-fade">
        <div :key="activeTab">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">仪表板概览</h1>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">欢迎使用您的 Motel 仪表板</p>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
              <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div class="p-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-6 w-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                      <dl>
                        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                          活跃 API Key
                        </dt>
                        <dd class="text-lg font-medium text-gray-900 dark:text-white">
                          {{ apiKeysStats.active }}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div class="p-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                      <dl>
                        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                          已删除 API Key
                        </dt>
                        <dd class="text-lg font-medium text-gray-900 dark:text-white">
                          {{ apiKeysStats.deleted }}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div class="p-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-6 w-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                      <dl>
                        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                          总请求数
                        </dt>
                        <dd class="text-lg font-medium text-gray-900 dark:text-white">
                          {{ formatNumber(userProfile?.totalUsage?.requests || 0) }}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div class="p-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-6 w-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                      <dl>
                        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                          输入 Tokens
                        </dt>
                        <dd class="text-lg font-medium text-gray-900 dark:text-white">
                          {{ formatNumber(userProfile?.totalUsage?.inputTokens || 0) }}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                <div class="p-5">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-6 w-6 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="ml-5 w-0 flex-1">
                      <dl>
                        <dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                          总费用
                        </dt>
                        <dd class="text-lg font-medium text-gray-900 dark:text-white">
                          ${{ (userProfile?.totalUsage?.totalCost || 0).toFixed(4) }}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Usage Overview (compact) -->
            <DashboardUsageOverview @view-details="handleTabChange('usage')" />
          </div>

          <!-- Store Tab -->
          <div v-else-if="activeTab === 'store'">
            <StorePlansSection />
          </div>

          <!-- Account Tab -->
          <div v-else-if="activeTab === 'account'" class="space-y-6">
            <div class="rounded-lg bg-white shadow dark:bg-gray-800">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  账户信息
                </h3>
                <div class="mt-5 border-t border-gray-200 dark:border-gray-700">
                  <dl class="divide-y divide-gray-200 dark:divide-gray-700">
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">用户名</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ userProfile?.username }}
                      </dd>
                    </div>
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">显示名称</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ userProfile?.displayName || 'N/A' }}
                      </dd>
                    </div>
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">邮箱</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ userProfile?.email || 'N/A' }}
                      </dd>
                    </div>
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">角色</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        <span
                          class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {{ userProfile?.role || 'user' }}
                        </span>
                      </dd>
                    </div>
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">注册时间</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ formatDate(userProfile?.createdAt) }}
                      </dd>
                    </div>
                    <div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">最近登录</dt>
                      <dd class="mt-1 text-sm text-gray-900 dark:text-white sm:col-span-2 sm:mt-0">
                        {{ formatDate(userProfile?.lastLoginAt) || 'N/A' }}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <!-- Usage Stats Tab -->
          <div v-else-if="activeTab === 'usage'">
            <UserUsageStats />
          </div>

          <!-- My Orders Tab -->
          <div v-else-if="activeTab === 'orders'" class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">我的订单</h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  查看您的 API Key 购买记录
                </p>
              </div>
              <router-link
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                to="/user/store"
              >
                去购买
              </router-link>
            </div>

            <div v-if="ordersLoading" class="flex items-center justify-center py-16">
              <svg
                class="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
              >
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div
              v-else-if="orders.length === 0"
              class="rounded-lg bg-white py-16 text-center shadow dark:bg-gray-800"
            >
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                />
              </svg>
              <p class="mt-4 text-gray-500 dark:text-gray-400">暂无订单。</p>
              <router-link
                class="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                to="/user/store"
              >
                浏览套餐 →
              </router-link>
            </div>

            <div v-else class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      渠道 / 套餐
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      充值金额
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      状态
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      下单时间
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      API Key
                    </th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
                >
                  <tr
                    v-for="order in orders"
                    :key="order.orderId"
                    class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    @click="openOrderDetail(order)"
                  >
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ order.planName }}
                      </div>
                      <div
                        v-if="order.channel"
                        class="mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      >
                        {{ order.channel }}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        v-if="order.amount != null"
                        class="text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        ¥{{ order.amount }}
                      </div>
                      <div
                        v-if="order.creditUSD != null"
                        class="text-xs font-medium text-blue-600 dark:text-blue-400"
                      >
                        ≈ ${{ Number(order.creditUSD).toFixed(4) }}
                      </div>
                      <div v-if="order.amount == null" class="text-sm text-gray-400">—</div>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        :class="[
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
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
                      <p
                        v-if="order.status === 'rejected' && order.rejectReason"
                        class="mt-1 text-xs text-red-500 dark:text-red-400"
                      >
                        {{ order.rejectReason }}
                      </p>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(order.createdAt) }}
                    </td>
                    <td class="px-6 py-4">
                      <div v-if="order.status === 'approved' && order.apiKeyValue">
                        <div class="flex items-center gap-2">
                          <code
                            class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {{
                              visibleKeys[order.orderId] ? order.apiKeyValue : '••••••••••••••••'
                            }}
                          </code>
                          <button
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            @click.stop="toggleKeyVisibility(order.orderId)"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                v-if="visibleKeys[order.orderId]"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                              />
                              <path
                                v-else
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                              />
                            </svg>
                          </button>
                          <button
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            @click.stop="copyKey(order.apiKeyValue)"
                          >
                            <svg
                              class="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                              />
                            </svg>
                          </button>
                          <button
                            class="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                            title="发送一条消息测试 API 是否通畅"
                            @click.stop="openTest(order)"
                          >
                            自测
                          </button>
                        </div>
                      </div>
                      <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tutorial Tab -->
          <div v-else-if="activeTab === 'tutorial'" class="space-y-6">
            <TutorialView />
          </div>
        </div>
      </Transition>
    </main>

    <ApiKeyTestDialog :order="testOrder" :show="testDialogOpen" @close="closeTest" />

    <OrderDetailDialog
      :order="detailOrder"
      :show="detailDialogOpen"
      @close="closeOrderDetail"
      @deleted="onOrderDeleted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { showToast, formatNumber, formatDate } from '@/utils/tools'
import { getUserOrdersApi } from '@/utils/http_apis'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import UserUsageStats from '@/components/user/UserUsageStats.vue'
import DashboardUsageOverview from '@/components/user/DashboardUsageOverview.vue'
import StorePlansSection from '@/components/user/StorePlansSection.vue'
import TutorialView from '@/views/TutorialView.vue'
import ApiKeyTestDialog from '@/components/user/ApiKeyTestDialog.vue'
import OrderDetailDialog from '@/components/user/OrderDetailDialog.vue'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const activeTab = ref('overview')
const userProfile = ref(null)
const apiKeysStats = ref({ active: 0, deleted: 0 })

// Orders
const orders = ref([])
const ordersLoading = ref(false)
const visibleKeys = reactive({})

const toggleKeyVisibility = (orderId) => {
  visibleKeys[orderId] = !visibleKeys[orderId]
}

const copyKey = async (key) => {
  try {
    await navigator.clipboard.writeText(key)
    showToast('已复制到剪贴板', 'success')
  } catch {
    showToast('复制失败', 'error')
  }
}

const testDialogOpen = ref(false)
const testOrder = ref(null)

const openTest = (order) => {
  if (!order?.apiKeyValue) {
    showToast('该订单暂无可用 API Key', 'error')
    return
  }
  testOrder.value = order
  testDialogOpen.value = true
}

const closeTest = () => {
  testDialogOpen.value = false
  testOrder.value = null
}

const detailDialogOpen = ref(false)
const detailOrder = ref(null)

const openOrderDetail = (order) => {
  detailOrder.value = order
  detailDialogOpen.value = true
}

const closeOrderDetail = () => {
  detailDialogOpen.value = false
  detailOrder.value = null
}

const onOrderDeleted = (orderId) => {
  orders.value = orders.value.filter((o) => o.orderId !== orderId)
  loadOrders()
}

const loadOrders = async () => {
  ordersLoading.value = true
  try {
    const res = await getUserOrdersApi()
    orders.value = res.data.orders || []
  } catch {
    showToast('加载订单失败', 'error')
  } finally {
    ordersLoading.value = false
  }
}

const handleTabChange = (tab) => {
  activeTab.value = tab
  if (tab === 'overview') loadApiKeysStats()
  if (tab === 'orders') loadOrders()
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    showToast('退出登录成功', 'success')
    router.push('/user/store')
  } catch (error) {
    showToast('退出登录失败', 'error')
  }
}

const loadUserProfile = async () => {
  try {
    userProfile.value = await userStore.getUserProfile()
  } catch (error) {
    console.error('Failed to load user profile:', error)
    showToast('加载用户信息失败', 'error')
  }
}

const loadApiKeysStats = async () => {
  try {
    const allApiKeys = await userStore.getUserApiKeys(true) // Include deleted keys
    console.log('All API Keys received:', allApiKeys)

    const activeKeys = allApiKeys.filter(
      (key) => !(key.isDeleted === 'true' || key.deletedAt) && key.isActive
    )
    const deletedKeys = allApiKeys.filter((key) => key.isDeleted === 'true' || key.deletedAt)

    console.log('Active keys:', activeKeys)
    console.log('Deleted keys:', deletedKeys)
    console.log('Active count:', activeKeys.length)
    console.log('Deleted count:', deletedKeys.length)

    apiKeysStats.value = { active: activeKeys.length, deleted: deletedKeys.length }
  } catch (error) {
    console.error('Failed to load API keys stats:', error)
    apiKeysStats.value = { active: 0, deleted: 0 }
  }
}

onMounted(() => {
  // 初始化主题
  themeStore.initTheme()
  loadUserProfile()
  loadApiKeysStats()
})
</script>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
