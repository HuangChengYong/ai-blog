<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadAdminPermissionGroups, type AdminPermissionGroup } from '../../services/admin'

const permissionGroups = ref<AdminPermissionGroup[]>([])

onMounted(async () => {
  permissionGroups.value = await loadAdminPermissionGroups()
})
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <h1>权限配置</h1>
      <p>按角色分配后端功能权限点。</p>
    </div>
    <section class="permission-editor">
      <section v-for="group in permissionGroups" :key="group.title" class="permission-group">
        <h3>{{ group.title }}</h3>
        <div class="permission-items">
          <el-checkbox v-for="item in group.items" :key="item.code" :label="item.name">
            <strong>{{ item.name }}</strong>
            <small>{{ item.description }}</small>
          </el-checkbox>
        </div>
      </section>
    </section>
  </section>
</template>