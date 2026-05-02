<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { markdownToHtml } from '../utils/markdown'
import { uploadStorageObject } from '../services/storage'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fileInput = ref<HTMLInputElement>()
const textarea = ref<HTMLTextAreaElement>()
const uploading = ref(false)
const html = computed(() => markdownToHtml(props.modelValue || ''))

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function update(value: string) {
  emit('update:modelValue', value)
}

function openFilePicker() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  uploading.value = true
  try {
    const object = await uploadStorageObject(file)
    insertAtCursor(`\n<img src="${escapeAttribute(object.publicUrl)}" alt="${escapeAttribute(object.originalName || file.name)}" data-storage-id="${object.id}" style="width: 60%;" />\n`)
    ElMessage.success('图片已上传')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '图片上传失败')
  } finally {
    uploading.value = false
  }
}

function insertAtCursor(markdown: string) {
  const element = textarea.value
  if (!element) {
    update(`${props.modelValue || ''}${markdown}`)
    return
  }

  const start = element.selectionStart
  const end = element.selectionEnd
  const next = `${props.modelValue.slice(0, start)}${markdown}${props.modelValue.slice(end)}`
  update(next)
  requestAnimationFrame(() => {
    element.focus()
    element.selectionStart = start + markdown.length
    element.selectionEnd = start + markdown.length
  })
}

function startResize(event: MouseEvent) {
  const image = event.target instanceof HTMLImageElement ? event.target : null
  const storageId = image?.dataset.storageId
  const parent = image?.parentElement
  if (!image || !storageId || !parent) {
    return
  }
  const targetImage = image
  const targetStorageId = storageId

  event.preventDefault()
  const startX = event.clientX
  const parentWidth = Math.max(parent.clientWidth, 1)
  const startWidth = targetImage.getBoundingClientRect().width

  function resize(moveEvent: MouseEvent) {
    const width = Math.min(100, Math.max(20, ((startWidth + moveEvent.clientX - startX) / parentWidth) * 100))
    targetImage.style.width = `${width.toFixed(1)}%`
    updateImageWidth(targetStorageId, `${width.toFixed(1)}%`)
  }

  function stopResize() {
    window.removeEventListener('mousemove', resize)
    window.removeEventListener('mouseup', stopResize)
  }

  window.addEventListener('mousemove', resize)
  window.addEventListener('mouseup', stopResize)
}

function updateImageWidth(storageId: string, width: string) {
  const pattern = new RegExp(`<img\\b(?=[^>]*data-storage-id=["']${storageId}["'])[^>]*>`)
  const match = props.modelValue.match(pattern)
  if (!match) {
    return
  }

  const current = match[0]
  const next = current.includes('style=')
    ? current.replace(/style=["'][^"']*["']/, `style="width: ${width};"`)
    : current.replace(/\s*\/?>$/, ` style="width: ${width};" />`)
  update(props.modelValue.replace(current, next))
}
</script>

<template>
  <div class="markdown-editor">
    <div class="markdown-editor-toolbar">
      <button type="button" :disabled="uploading" @click="openFilePicker">
        <el-icon><Picture /></el-icon>
        <span>{{ uploading ? '上传中' : '插入图片' }}</span>
      </button>
      <input ref="fileInput" type="file" accept="image/*" @change="handleFileChange" />
    </div>
    <div class="markdown-editor-grid">
      <textarea ref="textarea" :value="modelValue" @input="update(($event.target as HTMLTextAreaElement).value)"></textarea>
      <div class="markdown-editor-preview" title="拖动图片可调整宽度" @mousedown="startResize" v-html="html"></div>
    </div>
  </div>
</template>
