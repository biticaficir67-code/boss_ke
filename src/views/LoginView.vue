<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, refreshAuth, acceptAuth } from '../lib/auth.js';
import { request } from '../lib/api.js';
import Icon from '../components/Icon.vue';
const router = useRouter();
const username = ref('admin');
const password = ref('');
const confirmation = ref('');
const busy = ref(false);
const loading = ref(true);
const error = ref('');
const showPassword = ref(false);
onMounted(async () => {
  document.title = '登录 · 内容工作台';
  try { await refreshAuth(); if (auth.authenticated) await router.replace('/admin'); }
  catch { error.value = '无法连接本地服务，请确认项目已经启动'; }
  finally { loading.value = false; }
});
async function submit() {
  error.value = '';
  if (auth.needsSetup && password.value !== confirmation.value) { error.value = '两次输入的密码不一致'; return; }
  busy.value = true;
  try { const result = await request(`/api/auth/${auth.needsSetup ? 'setup' : 'login'}`, { method: 'POST', body: { username: username.value, password: password.value } }); acceptAuth({ ...result, authenticated: true, needsSetup: false }); await router.replace('/admin'); }
  catch (err) { error.value = err.message; }
  finally { busy.value = false; }
}
</script>
<template>
  <main class="login-page"><section class="login-art"><img src="/sample-art/island.svg" alt="暮色中的海岛与灯塔"><div class="login-art-shade"></div><a class="login-brand" href="/">✦ <span>雾海来信 <small>GAME WEBSITE STUDIO</small></span></a><div class="login-art-copy"><span>MAKE ROOM FOR YOUR STORY</span><h1>你的世界，<br>值得被看见。</h1><p>把故事、画面与每一次更新，<br>带到玩家面前。</p></div><span class="login-art-footer">独立游戏官网 · 内容工作台</span></section>
  <section class="login-form-side"><a class="back-link" href="/">← 返回游戏官网</a><div class="login-form-wrap"><div class="login-symbol"><Icon name="lock" :size="24" /></div><p class="eyebrow">CONTENT WORKSPACE</p><h2>{{ auth.needsSetup ? '创建你的工作台' : '欢迎回来' }}</h2><p class="muted">{{ auth.needsSetup ? '首次运行，请为这份官网设置唯一的管理员账号。' : '登录后，继续编辑与发布你的游戏故事。' }}</p><div v-if="loading" class="notice">正在连接服务…</div><form v-else @submit.prevent="submit"><label>管理员账号<input v-model="username" name="username" autocomplete="username" required minlength="3" maxlength="32" placeholder="例如 admin"></label><label>密码<div class="password-input"><input v-model="password" name="password" :type="showPassword ? 'text' : 'password'" :autocomplete="auth.needsSetup ? 'new-password' : 'current-password'" required :minlength="auth.needsSetup ? 10 : undefined" maxlength="128" placeholder="请输入密码"><button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword"><Icon name="eye" :size="18" /></button></div><small v-if="auth.needsSetup">至少 10 个字符，建议使用字母、数字和符号组合。</small></label><label v-if="auth.needsSetup">确认密码<input v-model="confirmation" name="confirmation" type="password" autocomplete="new-password" required minlength="10" placeholder="再次输入密码"></label><p v-if="error" class="form-error" role="alert">{{ error }}</p><p v-if="auth.needsSetup && !auth.setupAllowed" class="form-error">请先在本机使用默认 HOST=127.0.0.1 启动服务并创建账号。</p><button class="button primary login-submit" :disabled="busy || (auth.needsSetup && !auth.setupAllowed)">{{ busy ? '正在处理…' : auth.needsSetup ? '创建账号，开始编辑' : '进入工作台' }}<Icon name="arrow" :size="18" /></button></form><div class="login-hint"><Icon name="info" :size="16" /><p>{{ auth.needsSetup ? '账号和内容保存在本地 .data 目录，不会提交到 Git。请记住密码，并定期备份数据。' : '这是网站管理员入口。普通访客无需登录即可浏览和下载。' }}</p></div></div><p class="login-bottom">专注内容，其余交给你的工作台。</p></section></main>
</template>
