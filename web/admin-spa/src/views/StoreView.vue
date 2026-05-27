<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 顶部导航 -->
    <nav class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-2">
          <svg
            class="h-7 w-7 text-blue-600 dark:text-blue-400"
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
          <span class="text-lg font-bold text-gray-900 dark:text-white">Motel</span>
        </div>
        <div class="flex items-center gap-3">
          <ThemeToggle mode="icon" />
          <template v-if="isLoggedIn">
            <router-link
              class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              to="/user/dashboard"
              >控制台</router-link
            >
          </template>
          <template v-else>
            <router-link
              class="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              to="/user/login"
              >登录</router-link
            >
            <router-link
              class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              to="/user/register"
              >注册</router-link
            >
          </template>
        </div>
      </div>
    </nav>

    <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <StorePlansSection />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import StorePlansSection from '@/components/user/StorePlansSection.vue'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isAuthenticated)
</script>
