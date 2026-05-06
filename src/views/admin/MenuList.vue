<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus } from '@element-plus/icons-vue'
import {
  createAdminMenu,
  deleteAdminMenu,
  loadAdminMenus,
  updateAdminMenu,
  type AdminMenu,
  type UpdateMenuRequest,
} from '../../services/admin'
import { hasPermission } from '../../services/auth'

const menuRows = ref<AdminMenu[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

const form = reactive<UpdateMenuRequest>({
  title: '',
  path: '',
  permission: '',
  order: 0,
  visible: 1,
  status: 1,
})

onMounted(async () => {
  await load()
})

async function load() {
  loading.value = true
  try {
    menuRows.value = await loadAdminMenus()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  editId.value = ''
  form.title = ''
  form.path = ''
  form.permission = ''
  form.order = 0
  form.visible = 1
  form.status = 1
  dialogVisible.value = true
}

function openEdit(menu: AdminMenu) {
  isEdit.value = true
  editId.value = menu.id
  form.title = menu.title
  form.path = menu.path
  form.permission = menu.permission
  form.order = menu.order
  form.visible = menu.visible ? 1 : 0
  form.status = menu.status === 'enabled' ? 1 : 0
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.title.trim()) {
    ElMessage.warning('菜单名称不能为空')
    return
  }
  if (!form.path.trim()) {
    ElMessage.warning('路由路径不能为空')
    return
  }
  try {
    if (isEdit.value) {
      await updateAdminMenu(editId.value, { ...form })
      ElMessage.success('菜单已更新')
    } else {
      await createAdminMenu({ ...form })
      ElMessage.success('菜单已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败')
  }
}

async function handleDelete(menu: AdminMenu) {
  try {
    await ElMessageBox.confirm(`确定删除菜单 [${menu.title}] 吗？`, '删除菜单', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteAdminMenu(menu.id)
    ElMessage.success('菜单已删除')
    await load()
  } catch {
    // cancelled
  }
}
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <div>
        <h1>菜单管理</h1>
        <p>维护后台菜单名称、路由、权限标识和显示状态。</p>
      </div>
      <el-button v-if="hasPermission('menu.manage')" type="primary" :icon="Plus" @click="openCreate">
        新建菜单
      </el-button>
    </div>

    <section v-loading="loading" class="menu-manager">
      <article v-for="menu in menuRows" :key="menu.id" class="menu-row">
        <div class="menu-field">
          <span>名称</span>
          <el-input v-model="menu.title" disabled />
        </div>
        <div class="menu-field">
          <span>路由</span>
          <el-input v-model="menu.path" disabled />
        </div>
        <div class="menu-field">
          <span>权限</span>
          <el-input v-model="menu.permission" disabled />
        </div>
        <div class="menu-switches">
          <el-tag :type="menu.visible ? 'success' : 'info'">{{ menu.visible ? '显示' : '隐藏' }}</el-tag>
          <el-tag :type="menu.status === 'enabled' ? 'success' : 'info'">
            {{ menu.status === 'enabled' ? '启用' : '禁用' }}
          </el-tag>
        </div>
        <div class="menu-actions">
          <el-button v-if="hasPermission('menu.manage')" :icon="Edit" size="small" @click="openEdit(menu)">
            编辑
          </el-button>
          <el-button v-if="hasPermission('menu.manage')" :icon="Delete" size="small" type="danger" @click="handleDelete(menu)">
            删除
          </el-button>
        </div>
      </article>
      <el-empty v-if="menuRows.length === 0" description="暂无菜单" />
    </section>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑菜单' : '新建菜单'" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="form.title" size="large" />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.path" size="large" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.permission" size="large" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.order" :min="0" size="large" />
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="form.visible" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
.menu-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
</style>
