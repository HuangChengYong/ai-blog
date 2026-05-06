<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, User, UserFilled } from '@element-plus/icons-vue'
import {
  createAdminUser,
  deleteAdminUser,
  loadAdminUsers,
  toggleUserStatus,
  updateAdminUser,
  type AdminUser,
  type UpdateUserRequest,
} from '../../services/admin'
import { hasPermission } from '../../services/auth'

const users = ref<AdminUser[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

const form = reactive<UpdateUserRequest>({
  username: '',
  password: '',
  roleId: '',
  dataScope: 'SELF',
})

onMounted(async () => {
  await load()
})

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

function openCreate() {
  isEdit.value = false
  editId.value = ''
  form.username = ''
  form.password = ''
  form.roleId = ''
  form.dataScope = 'SELF'
  dialogVisible.value = true
}

function openEdit(user: AdminUser) {
  isEdit.value = true
  editId.value = user.id
  form.username = user.name
  form.password = ''
  form.roleId = ''
  form.dataScope = user.scope === '全部权限' ? 'ALL' : 'SELF'
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
  try {
    if (isEdit.value) {
      await updateAdminUser(editId.value, {
        username: form.username.trim(),
        password: form.password || undefined,
        roleId: form.roleId || '',
        dataScope: form.dataScope,
      })
      ElMessage.success('用户已更新')
    } else {
      await createAdminUser({
        username: form.username.trim(),
        password: form.password,
        roleId: form.roleId || '',
        dataScope: form.dataScope,
      })
      ElMessage.success('用户已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

async function handleDelete(user: AdminUser) {
  try {
    await ElMessageBox.confirm(`确定删除用户 [${user.name}] 吗？`, '删除用户', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteAdminUser(user.id)
    ElMessage.success('用户已删除')
    await load()
  } catch {
    // cancelled
  }
}

async function handleToggleStatus(user: AdminUser) {
  const nextStatus = user.status === '启用' ? 0 : 1
  try {
    await toggleUserStatus(user.id, nextStatus)
    ElMessage.success(nextStatus === 1 ? '用户已启用' : '用户已停用')
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <h1>用户管理</h1>
      <el-button v-if="hasPermission('user.create')" type="primary" :icon="User" @click="openCreate">
        新建用户
      </el-button>
    </div>

    <div v-loading="loading" class="admin-table-card">
      <article v-for="user in users" :key="user.id" class="user-row">
        <el-icon class="admin-avatar"><UserFilled /></el-icon>
        <div class="info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.scope }}</p>
        </div>
        <el-tag>{{ user.role }}</el-tag>
        <el-tag :type="user.status === '启用' ? 'success' : 'info'">{{ user.status }}</el-tag>
        <div class="user-actions">
          <el-button
            v-if="hasPermission('user.update')"
            :icon="Edit"
            size="small"
            @click="openEdit(user)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasPermission('user.disable')"
            size="small"
            :type="user.status === '启用' ? 'warning' : 'success'"
            @click="handleToggleStatus(user)"
          >
            {{ user.status === '启用' ? '停用' : '启用' }}
          </el-button>
          <el-button
            v-if="hasPermission('user.disable')"
            :icon="Delete"
            size="small"
            type="danger"
            @click="handleDelete(user)"
          >
            删除
          </el-button>
        </div>
      </article>
      <el-empty v-if="users.length === 0" description="暂无用户" />
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新建用户'" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="form.username" size="large" />
        </el-form-item>
        <el-form-item :label="isEdit ? '密码（留空则不修改）' : '密码'">
          <el-input v-model="form.password" type="password" size="large" />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" size="large">
            <el-option label="本人数据" value="SELF" />
            <el-option label="全部权限" value="ALL" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.user-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
