<script setup>
import { ref, onMounted } from 'vue';
import { request } from '../lib/api.js';
import { renderDocument } from '../site/render.js';
import { previewOptions } from '../lib/hosting.js';
const html = ref('');
const error = ref('');
const mobile = ref(false);
onMounted(async () => { document.title = '草稿预览 · 内容工作台'; try { const draft = await request('/api/admin/draft'); html.value = renderDocument(draft.content, previewOptions()); } catch (err) { error.value = err.message; } });
</script>
<template><div class="full-preview"><header><RouterLink to="/admin">← 返回工作台</RouterLink><span>已保存草稿预览 · 尚未发布</span><button class="button small" @click="mobile = !mobile">{{ mobile ? '切换电脑视图' : '切换手机视图' }}</button></header><p v-if="error" class="form-error">{{ error }}</p><iframe v-if="html" :srcdoc="html" title="游戏官网草稿预览" :class="{ mobile }" sandbox="allow-scripts allow-same-origin"></iframe></div></template>
