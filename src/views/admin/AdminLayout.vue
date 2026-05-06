<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Document,
  FolderChecked,
  Key,
  Lock,
  MagicStick,
  Menu as MenuIcon,
  Setting,
  SwitchButton,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import {
  changePassword,
  getAdminAvatarUrl,
  getAdminRoleName,
  getAdminUsername,
  hasPermission,
  loadCurrentUser,
  logout,
} from '../../services/auth'

const router = useRouter()
const profileDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const username = computed(() => getAdminUsername())
const roleName = computed(() => getAdminRoleName())
const avatarUrl = computed(() => getAdminAvatarUrl())

const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const allNavItems = [
  { path: '/admin/overview', label: '总览', icon: DataAnalysis, permission: 'dashboard.view' },
  { path: '/admin/studio', label: 'AI 写作', icon: MagicStick, permission: 'studio.generate' },
  { path: '/admin/articles', label: '文章管理', icon: Document, permission: 'article.edit' },
  { path: '/admin/approvals', label: '内容审核', icon: FolderChecked, permission: 'approval.review' },
  { path: '/admin/users', label: '用户管理', icon: User, permission: 'user.view' },
  { path: '/admin/roles', label: '角色管理', icon: Setting, permission: 'role.view' },
  { path: '/admin/permissions', label: '权限配置', icon: Key, permission: 'permission.manage' },
  { path: '/admin/menus', label: '菜单管理', icon: MenuIcon, permission: 'menu.manage' },
]

const navItems = computed(() => allNavItems.filter(item => hasPermission(item.permission)))

onMounted(async () => {
  try {
    await loadCurrentUser()
  } catch {
    logout()
    router.replace('/admin/login')
  }
})

async function handlePasswordChange() {
  if (!passwordForm.current || !passwordForm.next) {
    ElMessage.warning('请填写当前密码和新密码')
    return
  }
  if (passwordForm.next.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (passwordForm.next !== passwordForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  try {
    await changePassword(passwordForm.current, passwordForm.next)
    passwordForm.current = ''
    passwordForm.next = ''
    passwordForm.confirm = ''
    passwordDialogVisible.value = false
    ElMessage.success('密码已更新')
  } catch {
    ElMessage.error('当前密码不正确')
  }
}

function handleLogout() {
  logout()
  router.replace('/admin/login')
}

function handleUserCommand(command: string) {
  if (command === 'profile') {
    profileDialogVisible.value = true
  }
  if (command === 'password') {
    passwordDialogVisible.value = true
  }
  if (command === 'logout') {
    handleLogout()
  }
}
</script>

<template>
  <section class="admin-page">
    <header class="admin-toolbar">
      <div class="admin-toolbar-brand">
        <span class="brand-mark">AI</span>
        <div>
          <strong>NeuroBlog</strong>
          <small>管理后台</small>
        </div>
      </div>

      <div class="admin-toolbar-title">
        <strong>管理后台</strong>
        <span>内容生产、审核发布、用户权限一体化管理。</span>
      </div>

      <el-dropdown trigger="click" @command="handleUserCommand">
        <button class="admin-user-menu" type="button">
          <span class="admin-user-copy">
            <strong>{{ username }}</strong>
            <small>{{ roleName }}</small>
          </span>
          <span class="admin-avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" />
            <el-icon v-else><UserFilled /></el-icon>
          </span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile" :icon="User">个人资料</el-dropdown-item>
            <el-dropdown-item command="password" :icon="Lock">修改密码</el-dropdown-item>
            <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="admin-body">
      <aside class="admin-sidebar">
        <nav class="admin-nav" aria-label="Admin navigation">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            v-slot="{ isActive, navigate }"
            custom
          >
            <button type="button" :class="{ active: isActive }" @click="navigate">
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </button>
          </router-link>
          <div v-if="navItems.length === 0" class="admin-nav-empty">
            暂无可访问菜单
          </div>
        </nav>
      </aside>

      <div class="admin-main">
        <main class="admin-content">
          <router-view />
        </main>
      </div>
    </div>

    <el-dialog v-model="profileDialogVisible" title="个人资料" width="min(520px, 92vw)">
      <div class="profile-card">
        <span class="admin-avatar large"><el-icon><UserFilled /></el-icon></span>
        <div>
          <h3>{{ username }}</h3>
          <p>{{ roleName }}</p>
          <p>当前账号会按照已分配角色动态展示菜单与权限。</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.current" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.next" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="passwordForm.confirm" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordChange">保存密码</el-button>
      </template>
    </el-dialog>
  </section>
</template>
