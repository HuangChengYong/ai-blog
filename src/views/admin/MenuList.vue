<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Menu as MenuIcon } from '@element-plus/icons-vue'
import { loadAdminMenus, type AdminMenu } from '../../services/admin'

const menuRows = ref<AdminMenu[]>([])

onMounted(async () => {
  menuRows.value = await loadAdminMenus()
})
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <div>
        <h1>菜单管理</h1>
        <p>维护后台菜单名称、路由、权限标识和显示状态。</p>
      </div>
      <el-button type="primary" :icon="MenuIcon">新建菜单</el-button>
    </div>

    <section class="menu-manager">
      <article v-for="menu in menuRows" :key="menu.path" class="menu-row">
        <div class="menu-field">
          <span>名称</span>
          <el-input v-model="menu.title" />
        </div>
        <div class="menu-field">
          <span>路由</span>
          <el-input v-model="menu.path" />
        </div>
        <div class="menu-switches">
          <el-switch v-model="menu.visible" active-text="显示" />
          <el-switch v-model="menu.status" active-value="enabled" active-text="启用" />
        </div>
      </article>
    </section>
  </section>
</template>