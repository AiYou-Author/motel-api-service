import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { APP_CONFIG, showToast } from '@/utils/tools'

// 路由懒加载
const LoginView = () => import('@/views/LoginView.vue')
const UserLoginView = () => import('@/views/UserLoginView.vue')
const UserRegisterView = () => import('@/views/UserRegisterView.vue')
const UserDashboardView = () => import('@/views/UserDashboardView.vue')
const StoreView = () => import('@/views/StoreView.vue')
const UserManagementView = () => import('@/views/UserManagementView.vue')
const MainLayout = () => import('@/components/layout/MainLayout.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const ApiKeysView = () => import('@/views/ApiKeysView.vue')
const ApiKeyUsageRecordsView = () => import('@/views/ApiKeyUsageRecordsView.vue')
const AccountsView = () => import('@/views/AccountsView.vue')
const AccountUsageRecordsView = () => import('@/views/AccountUsageRecordsView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const ApiStatsView = () => import('@/views/ApiStatsView.vue')
const QuotaCardsView = () => import('@/views/QuotaCardsView.vue')
const StoreOrdersView = () => import('@/views/StoreOrdersView.vue')
const StorePlansAdminView = () => import('@/views/StorePlansAdminView.vue')
const RequestDetailsView = () => import('@/views/RequestDetailsView.vue')
const ReferralConfigView = () => import('@/views/admin/ReferralConfigView.vue')
const ReferralWithdrawalView = () => import('@/views/admin/ReferralWithdrawalView.vue')

const routes = [
  {
    path: '/',
    redirect: () => {
      // 智能重定向：避免循环
      const currentPath = window.location.pathname
      const basePath = APP_CONFIG.basePath.replace(/\/$/, '') // 移除末尾斜杠

      // 如果当前路径已经是 basePath 或 basePath/，重定向到 api-stats
      if (currentPath === basePath || currentPath === basePath + '/') {
        return '/api-stats'
      }

      // 否则保持默认重定向
      return '/api-stats'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false, title: '管理员登录' }
  },
  {
    path: '/admin-login',
    redirect: '/login'
  },
  { path: '/user-login', redirect: '/user/login' },
  { path: '/user-register', redirect: '/user/register' },
  { path: '/store', redirect: '/user/store' },
  { path: '/user-dashboard', redirect: '/user/dashboard' },
  {
    path: '/user/login',
    name: 'UserLogin',
    component: UserLoginView,
    meta: { requiresAuth: false, userAuth: true, title: '用户登录' }
  },
  {
    path: '/user/register',
    name: 'UserRegister',
    component: UserRegisterView,
    meta: { requiresAuth: false, title: '用户注册' }
  },
  {
    path: '/user/store',
    name: 'Store',
    component: StoreView,
    meta: { requiresAuth: false, title: '商城' }
  },
  {
    path: '/user/dashboard',
    name: 'UserDashboard',
    component: UserDashboardView,
    meta: { requiresUserAuth: true, title: '用户中心' }
  },
  {
    path: '/api-stats',
    name: 'ApiStats',
    component: ApiStatsView,
    meta: { requiresAuth: false, title: 'API 统计' }
  },
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: '仪表盘' }
      }
    ]
  },
  {
    path: '/api-keys',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ApiKeys',
        component: ApiKeysView,
        meta: { title: 'API Keys' }
      }
    ]
  },
  {
    path: '/api-keys/:keyId/usage-records',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ApiKeyUsageRecords',
        component: ApiKeyUsageRecordsView,
        meta: { title: '使用记录' }
      }
    ]
  },
  {
    path: '/accounts',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Accounts',
        component: AccountsView,
        meta: { title: '账户管理' }
      }
    ]
  },
  {
    path: '/accounts/:accountId/usage-records',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AccountUsageRecords',
        component: AccountUsageRecordsView,
        meta: { title: '账户使用记录' }
      }
    ]
  },
  {
    path: '/settings',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Settings',
        component: SettingsView,
        meta: { title: '系统设置' }
      }
    ]
  },
  {
    path: '/user-management',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'UserManagement',
        component: UserManagementView,
        meta: { title: '用户管理' }
      }
    ]
  },
  {
    path: '/store-orders',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'StoreOrders',
        component: StoreOrdersView,
        meta: { requiresAuth: true, title: '订单管理' }
      }
    ]
  },
  {
    path: '/admin/store/plans',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'StorePlansAdmin',
        component: StorePlansAdminView,
        meta: { requiresAuth: true, title: '商城套餐' }
      }
    ]
  },
  {
    path: '/quota-cards',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'QuotaCards',
        component: QuotaCardsView,
        meta: { title: '额度卡' }
      }
    ]
  },
  {
    path: '/request-details',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'RequestDetails',
        component: RequestDetailsView,
        meta: { title: '请求详情' }
      }
    ]
  },
  {
    path: '/admin/referral/config',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ReferralConfig',
        component: ReferralConfigView,
        meta: { title: '返佣配置' }
      }
    ]
  },
  {
    path: '/admin/referral/withdrawals',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ReferralWithdrawal',
        component: ReferralWithdrawalView,
        meta: { title: '提现审核' }
      }
    ]
  },
  // 捕获所有未匹配的路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/api-stats'
  }
]

const router = createRouter({
  history: createWebHistory(APP_CONFIG.basePath),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  console.log('路由导航:', {
    to: to.path,
    from: from.path,
    fullPath: to.fullPath,
    requiresAuth: to.meta.requiresAuth,
    requiresUserAuth: to.meta.requiresUserAuth,
    isAuthenticated: authStore.isAuthenticated,
    isUserAuthenticated: userStore.isAuthenticated
  })

  // 防止重定向循环：如果已经在目标路径，直接放行
  if (to.path === from.path && to.fullPath === from.fullPath) {
    return next()
  }

  // 检查用户认证状态
  if (to.meta.requiresUserAuth) {
    if (!userStore.isAuthenticated) {
      // 尝试检查本地存储的认证信息
      try {
        const isUserLoggedIn = await userStore.checkAuth()
        if (!isUserLoggedIn) {
          return next('/user/login')
        }
      } catch (error) {
        // If the error is about disabled account, redirect to login with error
        if (error.message && error.message.includes('disabled')) {
          showToast(error.message, 'error')
        }
        return next('/user/login')
      }
    }
    return next()
  }

  // API Stats 页面不需要认证，直接放行
  if (to.path === '/api-stats' || to.path.startsWith('/api-stats')) {
    next()
  } else if (to.path === '/user/login') {
    // 如果已经是用户登录状态，重定向到用户仪表板
    if (userStore.isAuthenticated) {
      next('/user/dashboard')
    } else {
      next()
    }
  } else if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

// 更新页面标题
router.afterEach((to) => {
  const baseTitle = 'Motel API Service'
  const pageTitle = to.meta.title
  document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle
})

export default router
