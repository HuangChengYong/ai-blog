<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {User, UserFilled} from '@element-plus/icons-vue'
import {type AdminUser, loadAdminUsers} from '../../services/admin'

const users = ref<AdminUser[]>([])

onMounted(async () => {
  users.value = await loadAdminUsers()
})
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <h1>用户管理</h1>
      <el-button type="primary" :icon="User">新建用户</el-button>
    </div>
    <div class="admin-table-card">
      <article v-for="user in users" :key="user.name" class="user-row">
        <el-icon class="admin-avatar"><UserFilled /></el-icon>
        <div class="info">
          <h3>{{ user.name }}</h3>
          <p>{{ user.scope }}</p>
        </div>
        <el-tag>{{ user.role }}</el-tag>
        <el-tag :type="user.status === '在线' ? 'success' : 'info'">{{ user.status }}</el-tag>
      </article>
    </div>
  </section>
</template>