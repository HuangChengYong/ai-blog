import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated } from '../services/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/posts/:id', name: 'post-detail', component: PostDetailView },
    { path: '/admin/login', name: 'login', component: LoginView },
    { path: '/login', redirect: '/admin/login' },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true } },
    { path: '/write', redirect: '/admin' },
    { path: '/drafts', redirect: '/admin' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && isAuthenticated.value) {
    return { path: '/admin' }
  }

  return true
})

export default router
