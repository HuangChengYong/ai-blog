<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check,
  CircleCheckFilled,
  Delete,
  Edit,
  Monitor,
  Plus,
  Search,
  Setting,
} from '@element-plus/icons-vue'
import {
  createAdminRole,
  deleteAdminRole,
  loadAdminPermissionGroups,
  loadAdminRole,
  loadAdminRoles,
  updateAdminRole,
  type AdminPermissionGroup,
  type AdminRole,
} from '../../services/admin'
import { hasPermission } from '../../services/auth'

const roles = ref<AdminRole[]>([])
const permissionGroups = ref<AdminPermissionGroup[]>([])
const loading = ref(false)
const roleDetailLoading = ref(false)
const saving = ref(false)
const selectedRoleId = ref('')
const activeTab = ref('permissions')
const editDrawerVisible = ref(false)

const editForm = reactive({
  id: '',
  name: '',
  description: '',
  permissions: [] as string[],
})

const currentRole = computed(() => {
  return roles.value.find(role => role.id === selectedRoleId.value) || roles.value[0]
})

onMounted(async () => {
  loading.value = true
  try {
    const [rolesData, permissionData] = await Promise.all([
      loadAdminRoles(),
      loadAdminPermissionGroups(),
    ])
    roles.value = rolesData
    permissionGroups.value = permissionData
    if (roles.value.length > 0) {
      await selectRole(roles.value[0].id)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色数据加载失败')
  } finally {
    loading.value = false
  }
})

async function selectRole(id: string) {
  selectedRoleId.value = id
  roleDetailLoading.value = true
  try {
    const role = await loadAdminRole(id)
    replaceRole(role)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色权限加载失败')
  } finally {
    roleDetailLoading.value = false
  }
}

function handleOpenCreate() {
  editForm.id = ''
  editForm.name = ''
  editForm.description = ''
  editForm.permissions = []
  isCreateMode.value = true
  editDrawerVisible.value = true
}

function handleOpenEdit() {
  if (!currentRole.value) return
  editForm.id = currentRole.value.id
  editForm.name = currentRole.value.name
  editForm.description = currentRole.value.description || ''
  editForm.permissions = currentRole.value.permissionCodes?.length
    ? [...currentRole.value.permissionCodes]
    : permissionCodesFromNames(currentRole.value.permissions || [])
  isCreateMode.value = false
  editDrawerVisible.value = true
}

const isCreateMode = ref(false)

async function submitEdit() {
  if (!editForm.name.trim()) {
    ElMessage.warning('角色名称不能为空')
    return
  }

  saving.value = true
  try {
    if (isCreateMode.value) {
      const role = await createAdminRole({
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        roleCode: editForm.name.trim().toUpperCase().replace(/\s+/g, '_'),
        permissionCodes: editForm.permissions,
      })
      roles.value.push(role)
      selectedRoleId.value = role.id
      editDrawerVisible.value = false
      ElMessage.success(`角色 [${role.name}] 已创建`)
    } else {
      const role = await updateAdminRole(editForm.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        permissionCodes: editForm.permissions,
      })
      replaceRole(role)
      editDrawerVisible.value = false
      ElMessage.success(`角色 [${role.name}] 已成功更新`)
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '角色保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!currentRole.value) return
  if (currentRole.value.users > 0) {
    ElMessage.warning('该角色下还有绑定用户，无法直接删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确认要删除角色 [${currentRole.value.name}] 吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await deleteAdminRole(currentRole.value.id)
    const index = roles.value.findIndex(r => r.id === currentRole.value!.id)
    if (index >= 0) {
      roles.value.splice(index, 1)
    }
    if (roles.value.length > 0) {
      selectedRoleId.value = roles.value[0].id
    } else {
      selectedRoleId.value = ''
    }
    ElMessage.success('已删除')
  } catch {
    // cancelled
  }
}

function replaceRole(role: AdminRole) {
  const index = roles.value.findIndex(item => item.id === role.id)
  if (index >= 0) {
    roles.value.splice(index, 1, role)
  } else {
    roles.value.push(role)
  }
}

function permissionCodesFromNames(names: string[]) {
  const nameToCode = new Map<string, string>()
  for (const group of permissionGroups.value) {
    for (const item of group.items) {
      nameToCode.set(item.name, item.code)
    }
  }
  return names.map(name => nameToCode.get(name)).filter((code): code is string => Boolean(code))
}
</script>

<template>
  <section class="admin-page-section role-page">
    <div class="admin-page-head">
      <div>
        <h1>角色与权限</h1>
        <p>配置系统权限矩阵，确保团队成员拥有合适的访问级别。</p>
      </div>
      <el-button v-if="hasPermission('role.create')" type="primary" :icon="Plus" size="large" round @click="handleOpenCreate">
        新建角色
      </el-button>
    </div>

    <div class="role-layout" v-loading="loading">
      <aside class="role-sidebar">
        <div class="sidebar-search">
          <el-input placeholder="搜索角色..." :prefix-icon="Search" />
        </div>
        <div class="role-list">
          <button
            v-for="role in roles"
            :key="role.id"
            type="button"
            class="role-list-item"
            :class="{ 'is-active': selectedRoleId === role.id }"
            @click="selectRole(role.id)"
          >
            <span class="role-item-icon"><el-icon><Setting /></el-icon></span>
            <span class="role-item-info">
              <strong>{{ role.name }}</strong>
              <small>{{ role.users }} 位成员</small>
            </span>
            <el-icon v-if="selectedRoleId === role.id" class="active-check"><CircleCheckFilled /></el-icon>
          </button>
        </div>
      </aside>

      <main v-if="currentRole" class="role-detail" v-loading="roleDetailLoading">
        <section class="preview-card">
          <div class="preview-header">
            <div class="header-main">
              <div class="role-visual">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="role-title-box">
                <h2>{{ currentRole.name }}</h2>
                <p>{{ currentRole.description || '此角色尚未添加描述信息。' }}</p>
              </div>
            </div>
            <div class="header-actions">
              <el-button :icon="Edit" @click="handleOpenEdit" round>编辑角色</el-button>
              <el-button
                type="danger"
                plain
                :icon="Delete"
                circle
                :disabled="currentRole.name === '系统管理员'"
                @click="handleDelete"
              />
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <span>关联用户</span>
              <strong>{{ currentRole.users }}</strong>
            </div>
            <div class="stat-item">
              <span>权限触点</span>
              <strong>{{ currentRole.permissions?.length || 0 }}</strong>
            </div>
            <div class="stat-item">
              <span>状态</span>
              <strong class="status-active">活跃</strong>
            </div>
          </div>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="当前权限" name="permissions">
              <div class="permission-grid">
                <div v-for="permission in currentRole.permissions" :key="permission" class="perm-card">
                  <el-icon class="perm-check"><Check /></el-icon>
                  <span>{{ permission }}</span>
                </div>
              </div>
              <el-empty v-if="!currentRole.permissions?.length" description="暂无权限" />
            </el-tab-pane>
            <el-tab-pane label="操作日志" name="logs">
              <div class="empty-state">暂无近期的操作记录</div>
            </el-tab-pane>
          </el-tabs>
        </section>
      </main>
    </div>

    <el-drawer
      v-model="editDrawerVisible"
      title="修改角色权限"
      size="560px"
      class="custom-drawer"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-position="top" class="drawer-form">
        <el-form-item label="角色名称">
          <el-input v-model="editForm.name" size="large" />
        </el-form-item>
        <el-form-item label="功能描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-divider>权限配置</el-divider>

        <div class="drawer-perms">
          <section v-for="group in permissionGroups" :key="group.title" class="perm-group">
            <h4>{{ group.title }}</h4>
            <el-checkbox-group v-model="editForm.permissions" class="perm-checkbox-grid">
              <el-checkbox
                v-for="item in group.items"
                :key="item.code"
                :value="item.code"
                border
              >
                {{ item.name }}
              </el-checkbox>
            </el-checkbox-group>
          </section>
        </div>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button size="large" @click="editDrawerVisible = false">取消</el-button>
          <el-button type="primary" size="large" :loading="saving" @click="submitEdit">保存更改</el-button>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped>
.role-page {
  --role-surface: var(--surface);
  --role-surface-strong: var(--metric-bg);
  --role-surface-soft: var(--tool-bg);
  --role-hover: rgba(34, 211, 238, 0.1);
  --role-active: linear-gradient(135deg, rgba(34, 211, 238, 0.28), rgba(52, 211, 153, 0.18));
  --role-text: var(--text);
  --role-muted: var(--muted);
}

.role-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
  min-height: 600px;
}

.role-sidebar,
.preview-card {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--role-surface);
  box-shadow: var(--card-shadow);
}

.role-sidebar {
  display: flex;
  flex-direction: column;
}

.sidebar-search {
  padding: 20px;
}

.role-list {
  display: grid;
  gap: 8px;
  padding: 0 12px 20px;
}

.role-list-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--role-text);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.role-list-item:hover {
  background: var(--role-hover);
}

.role-list-item.is-active {
  border-color: rgba(34, 211, 238, 0.45);
  background: var(--role-active);
}

.role-item-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: var(--cyan);
  background: var(--role-surface-soft);
}

.role-item-info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.role-item-info strong {
  color: var(--role-text);
}

.role-item-info small,
.role-title-box p,
.stat-item span,
.perm-group h4 {
  color: var(--role-muted);
}

.active-check {
  margin-left: auto;
  color: var(--cyan);
}

.preview-card {
  padding: 40px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 40px;
}

.header-main {
  display: flex;
  gap: 24px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.role-visual {
  display: grid;
  width: 80px;
  height: 80px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, var(--cyan), #7367f0);
  font-size: 36px;
  box-shadow: 0 10px 20px rgba(115, 103, 240, 0.24);
}

.role-title-box h2 {
  margin: 0 0 8px;
  color: var(--role-text);
  font-size: 28px;
}

.role-title-box p {
  max-width: 540px;
  line-height: 1.6;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 40px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--role-surface-strong);
}

.stat-item {
  display: grid;
  gap: 8px;
  justify-items: center;
  border-right: 1px solid var(--line);
}

.stat-item:last-child {
  border-right: 0;
}

.stat-item strong {
  color: var(--role-text);
  font-size: 24px;
}

.status-active {
  color: var(--green) !important;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.perm-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  color: var(--role-text);
  background: var(--role-surface-soft);
}

.perm-check {
  color: var(--green);
}

.drawer-form {
  display: grid;
  gap: 16px;
  padding: 0 20px;
}

.drawer-perms {
  display: grid;
  gap: 24px;
}

.perm-group h4 {
  margin: 0 0 12px;
  font-size: 14px;
}

.perm-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
}

.empty-state {
  padding: 40px;
  color: var(--role-muted);
  text-align: center;
}

:deep(.el-tabs__item) {
  color: var(--role-muted);
}

:deep(.el-tabs__item.is-active) {
  color: var(--cyan);
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--line);
}

:deep(.el-checkbox.is-bordered) {
  width: 100%;
  margin-left: 0 !important;
  color: var(--role-text);
  background: var(--role-surface-strong);
  border-color: var(--line);
}

:deep(.el-checkbox.is-bordered .el-checkbox__label) {
  color: var(--role-text);
}

:deep(.el-checkbox.is-bordered.is-checked) {
  border-color: rgba(34, 211, 238, 0.72);
  background: rgba(34, 211, 238, 0.16);
}

:deep(.el-checkbox.is-bordered.is-checked .el-checkbox__label) {
  color: var(--cyan);
}

:deep(.custom-drawer.el-drawer) {
  color: var(--role-text);
  background: var(--surface-strong);
}

:deep(.custom-drawer .el-drawer__body) {
  padding: 0;
}

:deep(.custom-drawer .el-form-item__label),
:deep(.custom-drawer .el-divider__text) {
  color: var(--role-text);
  background: var(--surface-strong);
}

:deep(.custom-drawer .el-textarea__inner) {
  color: var(--role-text);
  background: var(--field-bg);
  border-color: var(--line);
  box-shadow: none;
}

:global(:root[data-theme='light']) .role-page {
  --role-hover: rgba(8, 145, 178, 0.08);
  --role-active: linear-gradient(135deg, rgba(8, 145, 178, 0.16), rgba(5, 150, 105, 0.12));
}

:global(:root[data-theme='light']) .role-sidebar,
:global(:root[data-theme='light']) .preview-card {
  border-color: rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

:global(:root[data-theme='light']) .role-item-icon,
:global(:root[data-theme='light']) .perm-card,
:global(:root[data-theme='light']) :deep(.el-checkbox.is-bordered) {
  background: rgba(241, 245, 249, 0.88);
}

:global(:root[data-theme='light']) .stats-row {
  background: rgba(248, 250, 252, 0.92);
}

@media (max-width: 900px) {
  .role-layout,
  .stats-row,
  .perm-checkbox-grid {
    grid-template-columns: 1fr;
  }

  .preview-header,
  .header-main {
    flex-direction: column;
  }

  .stat-item {
    padding: 12px 0;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .stat-item:last-child {
    border-bottom: 0;
  }
}
</style>
