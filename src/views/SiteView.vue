<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { request } from '../lib/api.js';
import { renderSite } from '../site/render.js';
import { mountSite } from '../site/runtime.js';
import '../site/site.css';
const html = ref('');
const error = ref('');
const root = ref();
let cleanup;
const retry = () => window.location.reload();
onMounted(async () => {
  try { const result = await request('/api/site'); html.value = renderSite(result.content); document.title = `${result.content.brand.name} · 游戏官网`; await nextTick(); cleanup = mountSite(root.value.querySelector('.game-site')); }
  catch (err) { error.value = err.message; }
});
onUnmounted(() => cleanup?.());
</script>
<template><div v-if="error" class="center-state"><h1>暂时无法加载官网</h1><p>{{ error }}</p><button class="button primary" @click="retry">重新加载</button></div><div v-else-if="!html" class="center-state"><span class="loading-dot"></span><p>正在打开这段旅程…</p></div><div v-else ref="root" v-html="html"></div></template>
