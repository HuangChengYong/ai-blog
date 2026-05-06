import { createRouter, createWebHistory } from 'vue-router'
import { hasPermission, isAuthenticated } from '../services/auth'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import PostDetailView from '../views/PostDetailView.vue'

import AdminLayout from '../views/admin/AdminLayout.vue'
import AIStudio from '../views/admin/AIStudio.vue'
import ApprovalList from '../views/admin/ApprovalList.vue'
import ArticleList from '../views/admin/ArticleList.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import MenuList from '../views/admin/MenuList.vue'
import NoAccess from '../views/admin/NoAccess.vue'
import PermissionList from '../views/admin/PermissionList.vue'
import RoleList from '../views/admin/RoleList.vue'
import UserList from '../views/admin/UserList.vue'

const adminRouteItems = [
  { path: '/admin/overview', name: 'admin-overview', permission: 'dashboard.view' },
  { path: '/admin/studio', name: 'admin-studio', permission: 'studio.generate' },
  { path: '/admin/articles', name: 'admin-articles', permission: 'article.edit' },
  { path: '/admin/approvals', name: 'admin-approvals', permission: 'approval.review' },
  { path: '/admin/users', name: 'admin-users', permission: 'user.view' },
  { path: '/admin/roles', name: 'admin-roles', permission: 'role.view' },
  { path: '/admin/permissions', name: 'admin-permissions', permission: 'permission.manage' },
  { path: '/admin/menus', name: 'admin-menus', permission: 'menu.manage' },
]

const routePermissions: Record<string, string> = {
  'admin-overview': 'dashboard.view',
  'admin-studio': 'studio.generate',
  'admin-articles': 'article.edit',
  'admin-approvals': 'approval.review',
  'admin-users': 'user.view',
  'admin-roles': 'role.view',
  'admin-permissions': 'permission.manage',
  'admin-menus': 'menu.manage',
}

export function firstAccessibleAdminPath() {
  return adminRouteItems.find(item => hasPermission(item.permission))?.path || '/admin/no-access'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/posts/:id', name: 'post-detail', component: PostDetailView },
    { path: '/admin/login', name: 'login', component: LoginView },
    { path: '/login', redirect: '/admin/login' },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: () => firstAccessibleAdminPath() },
        { path: 'overview', name: 'admin-overview', component: Dashboard },
        { path: 'studio', name: 'admin-studio', component: AIStudio },
        { path: 'articles', name: 'admin-articles', component: ArticleList },
        { path: 'approvals', name: 'admin-approvals', component: ApprovalList },
        { path: 'users', name: 'admin-users', component: UserList },
        { path: 'roles', name: 'admin-roles', component: RoleList },
        { path: 'permissions', name: 'admin-permissions', component: PermissionList },
        { path: 'menus', name: 'admin-menus', component: MenuList },
        { path: 'no-access', name: 'admin-no-access', component: NoAccess },
      ],
    },
    { path: '/write', redirect: '/admin/studio' },
    { path: '/drafts', redirect: '/admin/articles' },
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

  const permission = to.name ? routePermissions[String(to.name)] : undefined
  if (permission && !hasPermission(permission)) {
    const fallback = firstAccessibleAdminPath()
    return { path: fallback === to.path ? '/admin/no-access' : fallback }
  }

  return true
})

export default router
