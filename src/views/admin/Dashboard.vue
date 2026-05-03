<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { DataAnalysis, MagicStick } from '@element-plus/icons-vue'
import { loadAdminOverview, type AdminOverview } from '../../services/admin'

const overview = ref<AdminOverview>({
  stats: [],
  publishHealth: 0,
  healthText: '',
})

const dashboardStats = computed(() => overview.value.stats)

onMounted(async () => {
  overview.value = await loadAdminOverview()
})
</script>

<template>
  <section class="admin-page-section">
    <div class="admin-page-head">
      <div>
        <h1>总览</h1>
        <p>快速查看内容生产、审核压力和发布状态。</p>
      </div>
      <el-button type="primary" :icon="MagicStick" @click="$router.push('/admin/studio')">开始写作</el-button>
    </div>

    <section class="admin-stats">
      <div v-for="item in dashboardStats" :key="item.label" class="admin-kpi">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="overview-board">
      <div class="panel overview-feature">
        <div class="section-heading">
          <span>工作流说明</span>
          <strong><el-icon><DataAnalysis /></el-icon></strong>
        </div>
        <div class="workflow-steps">
          <div><span>1</span><h3>生成</h3><p>通过后端接口生成标题、正文和标签。</p></div>
          <div><span>2</span><h3>编辑</h3><p>完善文章内容，并提交进入审核流程。</p></div>
          <div><span>3</span><h3>发布</h3><p>审核通过后上架文章，面向访客展示。</p></div>
        </div>
      </div>

      <div class="panel overview-feature">
        <div class="section-heading">
          <span>发布健康度</span>
          <strong>{{ overview.publishHealth }}%</strong>
        </div>
        <div class="health-meter"><i :style="{ width: `${overview.publishHealth}%` }"></i></div>
        <p>{{ overview.healthText }}</p>
      </div>
    </section>
  </section>
</template>