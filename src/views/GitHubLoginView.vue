<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { request } from '../lib/api.js';
import { acceptAuth } from '../lib/auth.js';
import { githubConfig, websiteUrl, imageUrl } from '../lib/hosting.js';
import Icon from '../components/Icon.vue';
const router = useRouter();
const token = ref(''); const busy = ref(false); const error = ref('');
async function submit() {
  busy.value = true; error.value = '';
  try { acceptAuth(await request('/api/auth/login', { method: 'POST', body: { token: token.value } })); token.value = ''; await router.replace('/admin'); }
  catch (err) { error.value = err.message; }
  finally { busy.value = false; }
}
</script>
<template>
  <main class="login-page"><section class="login-art"><img :src="imageUrl('/sample-art/island.svg')" alt="暮色中的海岛与灯塔"><div class="login-art-shade"></div><a class="login-brand" :href="websiteUrl">✦ <span>游戏工作台 <small>GAME WEBSITE STUDIO</small></span></a><div class="login-art-copy"><span>MAKE ROOM FOR YOUR STORY</span><h1>你的世界，<br>值得被看见。</h1><p>编辑介绍、更新画面，<br>点击发布后自动更新官网。</p></div><span class="login-art-footer">GitHub Pages · 在线内容管理</span></section>
  <section class="login-form-side"><a class="back-link" :href="websiteUrl">← 返回游戏官网</a><div class="login-form-wrap"><div class="login-symbol"><Icon name="lock" :size="24" /></div><p class="eyebrow">CONTENT WORKSPACE</p><h2>授权你的工作台</h2><p class="muted">使用网站负责人提供的 GitHub 发布密钥进入。这里不使用原来的本地管理员密码。</p><form @submit.prevent="submit"><label>发布密钥<input v-model="token" name="publish-token" type="password" autocomplete="off" required placeholder="粘贴 GitHub 发布密钥"></label><p v-if="error" class="form-error" role="alert">{{ error }}</p><button class="button primary login-submit" :disabled="busy">{{ busy ? '正在连接 GitHub…' : '进入工作台' }}<Icon name="arrow" :size="18" /></button></form><div class="login-hint"><Icon name="info" :size="16" /><p>密钥只保留在当前标签页会话，退出后清除。日常编辑无需操作 Git；首次授权由网站负责人配置。</p></div><details class="github-help"><summary>网站负责人：如何取得发布密钥</summary><p>在 GitHub 创建仅授权此仓库的 fine-grained token，授予 Contents 的 Read and write 权限，并设置有效期。</p><p>目标仓库：{{ githubConfig.owner }}/{{ githubConfig.repository }}</p><p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">打开 GitHub 密钥设置 ↗</a></p><p>请勿粘贴 GitHub 登录密码，也不要把密钥写进网站代码或仓库文件。</p></details></div><p class="login-bottom">专注内容，其余交给你的工作台。</p></section></main>
</template>
<style scoped>.github-help{margin-top:20px;color:#687b6d;font-size:12px;line-height:1.8;overflow-wrap:anywhere}.github-help summary{cursor:pointer}.github-help a{color:#345344;text-decoration:underline}</style>
