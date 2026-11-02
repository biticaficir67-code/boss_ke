<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { request } from '../lib/api.js';
import { acceptAuth } from '../lib/auth.js';
import { githubConfig, websiteUrl, imageUrl } from '../lib/hosting.js';
import Icon from '../components/Icon.vue';
const router = useRouter();
const token = ref('');
const busy = ref(false);
const error = ref('');
async function submit() {
  busy.value = true;
  error.value = '';
  try {
    acceptAuth(await request('/api/auth/login', { method: 'POST', body: { token: token.value } }));
    token.value = '';
    await router.replace('/admin');
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="login-page">
    <section class="login-art">
      <img :src="imageUrl('/artwork/arrival.webp')" alt="夜雾里的旧邮局" />
      <div class="login-art-shade"></div>
      <a class="login-brand" :href="websiteUrl"
        ><Icon name="mail" :size="30" /> <span>游戏工作台 <small>未知档案</small></span></a
      >
      <div class="login-art-copy">
        <h1>未署名的来信，<br />等你归档。</h1>
      </div>
    </section>
    <section class="login-form-side">
      <a class="back-link" :href="websiteUrl">← 返回游戏官网</a>
      <div class="login-form-wrap">
        <div class="login-symbol"><Icon name="lock" :size="24" /></div>
        <h2>授权你的工作台</h2>
        <p class="muted">{{ githubConfig.owner }}/{{ githubConfig.repository }}</p>
        <form @submit.prevent="submit">
          <label
            >发布密钥<input
              v-model="token"
              name="publish-token"
              type="password"
              autocomplete="off"
              required
              placeholder="粘贴 GitHub 发布密钥"
          /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="button primary login-submit" :disabled="busy">
            {{ busy ? '正在连接 GitHub…' : '进入工作台' }}<Icon name="arrow" :size="18" />
          </button>
        </form>
        <div class="login-hint">
          <Icon name="lock" :size="16" />
          <p>授权仅保留在当前标签页，退出后清除。</p>
        </div>
        <details class="github-help">
          <summary>获取发布密钥</summary>
          <p>
            在 GitHub 创建仅授权此仓库的 fine-grained token，授予 Contents 的 Read and write
            权限，并设置有效期。
          </p>
          <p>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              >打开 GitHub 密钥设置 ↗</a
            >
          </p>
        </details>
      </div>
    </section>
  </main>
</template>
<style scoped>
.github-help {
  margin-top: 20px;
  color: #687b6d;
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.github-help summary {
  cursor: pointer;
}
.github-help a {
  color: #345344;
  text-decoration: underline;
}
</style>
