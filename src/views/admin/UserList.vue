<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, User, UserFilled } from '@element-plus/icons-vue'
import {
  assignAdminUserRole,
  createAdminUser,
  deleteAdminUser,
  loadAdminUsers,
  loadAdminRoles,
  toggleUserStatus,
  updateAdminUser,
  type AdminRole,
  type AdminUser,
  type UpdateUserRequest,
} from '../../services/admin'
import { hasPermission } from '../../services/auth'

const users = ref<AdminUser[]>([])
const roles = ref<AdminRole[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const actionLoadingKey = ref('')
const isEdit = ref(false)
const editId = ref('')
const roleDialogVisible = ref(false)
const roleSubmitLoading = ref(false)
const roleUser = ref<AdminUser | null>(null)
const roleForm = reactive({
  roleId: '',
})

const form = reactive<UpdateUserRequest>({
  username: '',
  password: '',
  nickname: '',
  avatarUrl: '',
  roleId: '',
  dataScope: 'SELF',
  status: 1,
})

const defaultRoleId = computed(() => {
  return roles.value.find(role => role.name !== '超级管理员')?.id || roles.value[0]?.id || ''
})

onMounted(async () => {
  await loadPageData()
})

async function loadPageData() {
  loading.value = true
  try {
    const [userData, roleData] = await Promise.all([loadAdminUsers(), loadAdminRoles()])
    users.value = userData
    roles.value = roleData
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    users.value = await loadAdminUsers()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function actionKey(action: string, userId: string) {
  return `${action}:${userId}`
}

function isActionLoading(action: string, userId: string) {
  return actionLoadingKey.value === actionKey(action, userId)
}

function openCreate() {
  isEdit.value = false
  editId.value = ''
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.avatarUrl = ''
  form.roleId = defaultRoleId.value
  form.dataScope = 'SELF'
  form.status = 1
  dialogVisible.value = true
}

function openEdit(user: AdminUser) {
  isEdit.value = true
  editId.value = user.id
  form.username = user.name
  form.password = ''
  form.nickname = user.nickname || ''
  form.avatarUrl = user.avatarUrl || ''
  form.roleId = user.roleId || ''
  form.dataScope = user.dataScope || (user.scope === '全部权限' ? 'ALL' : 'SELF')
  form.status = user.statusValue ?? (user.status === '启用' ? 1 : 0)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.username.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }
  if (!isEdit.value && !form.password) {
    ElMessage.warning('密码不能为空')
    return
  }
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateAdminUser(editId.value, {
        username: form.username.trim(),
        password: form.password || undefined,
        nickname: form.nickname?.trim() || undefined,
        avatarUrl: form.avatarUrl?.trim() || '',
        roleId: form.roleId || '',
        dataScope: form.dataScope,
        status: form.status,
      })
      ElMessage.success('用户已更新')
    } else {
      await createAdminUser({
        username: form.username.trim(),
        password: form.password,
        nickname: form.nickname?.trim() || undefined,
        avatarUrl: form.avatarUrl?.trim() || '',
        roleId: form.roleId || '',
        dataScope: form.dataScope,
        status: form.status,
      })
      ElMessage.success('用户已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(user: AdminUser) {
  try {
    await ElMessageBox.confirm(`确定删除用户 [${user.name}] 吗？`, '删除用户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    actionLoadingKey.value = actionKey('delete', user.id)
    await deleteAdminUser(user.id)
    ElMessage.success('用户已删除')
    await load()
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    actionLoadingKey.value = ''
  }
}

async function handleToggleStatus(user: AdminUser) {
  const nextStatus = user.status === '启用' ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定${nextStatus === 1 ? '启用' : '停用'}用户 [${user.name}] 吗？`, '修改用户状态', {
      confirmButtonText: nextStatus === 1 ? '启用' : '停用',
      cancelButtonText: '取消',
      type: 'warning',
    })
    actionLoadingKey.value = actionKey('status', user.id)
    await toggleUserStatus(user.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '用户已启用' : '用户已停用')
    await load()
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    actionLoadingKey.value = ''
  }
}

async function openAssignRole(user: AdminUser) {
  roleUser.value = user
  roleForm.roleId = user.roleId || ''
  roleDialogVisible.value = true
  try {
    roles.value = await loadAdminRoles()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色加载失败')
  }
}

async function handleAssignRole() {
  if (!roleUser.value) return
  roleSubmitLoading.value = true
  try {
    await assignAdminUserRole(roleUser.value.id, { roleId: roleForm.roleId || '' })
    ElMessage.success('角色已绑定')
    roleDialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '绑定失败')
  } finally {
    roleSubmitLoading.value = false
  }
}
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <h1>用户管理</h1>
      <el-button v-if="hasPermission('user.create')" type="primary" :icon="User" :disabled="loading" @click="openCreate">
        新建用户
      </el-button>
    </div>

    <div v-loading="loading" class="admin-table-card">
      <article v-for="user in users" :key="user.id" class="user-row">
        <span class="admin-avatar">
          <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" />
          <el-icon v-else><UserFilled /></el-icon>
        </span>
        <div class="info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.nickname || user.name }} · {{ user.scope }} · {{ user.lastSeen }}</p>
        </div>
        <div class="user-control-panel">
          <div class="user-tags">
            <el-tag :type="user.role === '未分配角色' ? 'warning' : undefined">{{ user.role }}</el-tag>
            <el-tag :type="user.status === '启用' ? 'success' : 'info'">{{ user.status }}</el-tag>
          </div>
          <div class="user-actions">
            <el-button
              v-if="hasPermission('user.update')"
              :icon="Edit"
              size="small"
              :disabled="Boolean(actionLoadingKey)"
              @click="openEdit(user)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPermission('user.update')"
              :icon="User"
              size="small"
              :disabled="Boolean(actionLoadingKey)"
              @click="openAssignRole(user)"
            >
              绑定角色
            </el-button>
            <el-button
              v-if="hasPermission('user.disable')"
              size="small"
              :type="user.status === '启用' ? 'warning' : 'success'"
              :loading="isActionLoading('status', user.id)"
              :disabled="Boolean(actionLoadingKey) && !isActionLoading('status', user.id)"
              @click="handleToggleStatus(user)"
            >
              {{ user.status === '启用' ? '停用' : '启用' }}
            </el-button>
            <el-button
              v-if="hasPermission('user.disable')"
              :icon="Delete"
              size="small"
              type="danger"
              :loading="isActionLoading('delete', user.id)"
              :disabled="Boolean(actionLoadingKey) && !isActionLoading('delete', user.id)"
              @click="handleDelete(user)"
            >
              删除
            </el-button>
          </div>
        </div>
      </article>
      <el-empty v-if="users.length === 0" description="暂无用户" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新建用户'" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" size="large" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" size="large" />
        </el-form-item>
        <el-form-item :label="isEdit ? '密码（留空则不修改）' : '密码'">
          <el-input v-model="form.password" type="password" size="large" show-password />
        </el-form-item>
        <el-form-item label="头像地址">
          <el-input v-model="form.avatarUrl" size="large" placeholder="可选，填写图片 URL" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleId" size="large" placeholder="请选择角色">
            <el-option v-if="isEdit" label="未分配角色" value="" />
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button :value="1">启用</el-radio-button>
            <el-radio-button :value="0">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" size="large">
            <el-option label="本人数据" value="SELF" />
            <el-option label="全部权限" value="ALL" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="绑定角色" width="min(420px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="用户">
          <el-input :model-value="roleUser?.name || ''" size="large" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="roleForm.roleId" size="large" placeholder="请选择角色">
            <el-option label="未分配角色" value="" />
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="roleSubmitLoading" @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitLoading" @click="handleAssignRole">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.user-row {
  grid-template-columns: auto minmax(0, 1fr) minmax(260px, auto);
}

.user-row .info {
  min-width: 0;
}

.user-row .info h3,
.user-row .info p {
  overflow-wrap: anywhere;
}

.user-control-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px 14px;
  min-width: 0;
}

.user-tags,
.user-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.user-actions .el-button {
  margin-left: 0;
}

@media (max-width: 1100px) {
  .user-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .user-control-panel {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 560px) {
  .user-row {
    grid-template-columns: 1fr;
  }

  .user-control-panel,
  .user-tags,
  .user-actions {
    justify-content: flex-start;
  }
}
</style>
