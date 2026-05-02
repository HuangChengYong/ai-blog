<script setup lang="ts">
import { computed } from 'vue'
import { markdownToHtml } from '../utils/markdown'

const props = defineProps<{
  content: string
}>()

const html = computed(() => markdownToHtml(props.content || ''))
</script>

<template>
  <div class="markdown-body" v-html="html"></div>
</template>
