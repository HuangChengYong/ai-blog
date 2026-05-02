<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, Lock, Right, User } from '@element-plus/icons-vue'
import { login } from '../services/auth'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const sliderTrack = ref<HTMLElement>()
const dragging = ref(false)
const dragOffset = ref(0)
const sliderVerified = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const sliderPercent = computed(() => {
  if (!sliderTrack.value) {
    return 0
  }

  return Math.min(100, Math.round((dragOffset.value / getMaxDrag()) * 100))
})

function getMaxDrag() {
  const width = sliderTrack.value?.clientWidth ?? 0
  return Math.max(width - 54, 1)
}

function moveSlider(clientX: number) {
  if (!sliderTrack.value || sliderVerified.value) {
    return
  }

  const { left } = sliderTrack.value.getBoundingClientRect()
  dragOffset.value = Math.min(Math.max(clientX - left - 27, 0), getMaxDrag())
}

function startSlide(event: PointerEvent) {
  if (sliderVerified.value) {
    return
  }

  dragging.value = true
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  moveSlider(event.clientX)
}

function onSlide(event: PointerEvent) {
  if (!dragging.value) {
    return
  }

  moveSlider(event.clientX)
}

function endSlide(event: PointerEvent) {
  if (!dragging.value) {
    return
  }

  dragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)

  if (sliderPercent.value >= 96) {
    sliderVerified.value = true
    dragOffset.value = getMaxDrag()
    ElMessage.success('滑块验证通过')
    return
  }

  dragOffset.value = 0
}

function resetSlider() {
  sliderVerified.value = false
  dragOffset.value = 0
}

async function handleLogin() {
  if (!sliderVerified.value) {
    ElMessage.warning('请先完成滑块验证')
    return
  }

  loading.value = true
  try {
    await login(form.username.trim(), form.password)
  } catch {
    ElMessage.error('账号或密码不正确')
    resetSlider()
    loading.value = false
    return
  }

  loading.value = false
  ElMessage.success('登录成功')
  router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/admin')
}
</script>

<template>
  <section class="login-layout">
    <div class="login-card">
      <div class="login-orbit" aria-hidden="true"></div>
      <div class="brand login-brand">
        <span class="brand-mark">AI</span>
        <span>
          <strong>NeuroBlog</strong>
          <small>控制台登录</small>
        </span>
      </div>

      <div class="login-copy">
        <h1>登录后管理内容工作台。</h1>
        <p>生成、编辑、预览、审核、上架和下架等操作只在登录后开放。</p>
      </div>

      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="账号">
          <el-input v-model="form.username" size="large" :prefix-icon="User" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            size="large"
            :prefix-icon="Lock"
            type="password"
            autocomplete="current-password"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <div class="slider-verify" :class="{ 'is-verified': sliderVerified }">
          <div ref="sliderTrack" class="slider-track">
            <div class="slider-fill" :style="{ width: `${sliderPercent}%` }"></div>
            <span class="slider-text">{{ sliderVerified ? '验证通过' : '向右拖动滑块完成验证' }}</span>
            <button
              v-if="!sliderVerified"
              class="slider-thumb"
              :style="{ transform: `translateX(${dragOffset}px)` }"
              type="button"
              aria-label="拖动滑块验证"
              @pointerdown="startSlide"
              @pointermove="onSlide"
              @pointerup="endSlide"
              @pointercancel="endSlide"
            >
              <el-icon>
                <Right />
              </el-icon>
            </button>
            <span
              v-else
              class="slider-thumb slider-thumb-done"
              :style="{ transform: `translateX(${dragOffset}px)` }"
              aria-label="滑块验证已通过"
              role="status"
            >
              <el-icon>
                <Check />
              </el-icon>
            </span>
          </div>
        </div>

        <el-button type="primary" size="large" :loading="loading" class="login-button" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </div>
  </section>
</template>
