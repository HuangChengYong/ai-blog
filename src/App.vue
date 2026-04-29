<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Moon, Sunny } from '@element-plus/icons-vue'

type ThemeMode = 'dark' | 'light'

const route = useRoute()
const theme = ref<ThemeMode>('dark')
const isLight = computed(() => theme.value === 'light')
const isAdminArea = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  const savedTheme = window.localStorage.getItem('ai-blog-theme')

  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme
  }
})

watch(
  theme,
  (value) => {
    document.documentElement.dataset.theme = value
    window.localStorage.setItem('ai-blog-theme', value)
  },
  { immediate: true },
)

function toggleTheme() {
  theme.value = isLight.value ? 'dark' : 'light'
}
</script>

<template>
  <div class="shell" :class="{ 'admin-shell': isAdminArea }">
    <div class="ambient-grid" aria-hidden="true"></div>
    <div class="energy-stream energy-stream-one" aria-hidden="true"></div>
    <div class="energy-stream energy-stream-two" aria-hidden="true"></div>

    <header v-if="!isAdminArea" class="topbar">
      <RouterLink class="brand" to="/" aria-label="返回首页">
        <span class="brand-mark">AI</span>
        <span>
          <strong>NeuroBlog</strong>
          <small>智能技术博客平台</small>
        </span>
      </RouterLink>
    </header>

    <main>
      <RouterView />
    </main>

    <button
      class="pull-lamp"
      :class="{ 'is-light': isLight }"
      type="button"
      :aria-label="isLight ? '切换为暗黑主题' : '切换为明亮主题'"
      @click="toggleTheme"
    >
      <span class="lamp-cord"></span>
      <span class="lamp-cap">
        <el-icon>
          <Sunny v-if="isLight" />
          <Moon v-else />
        </el-icon>
      </span>
    </button>
  </div>
</template>
