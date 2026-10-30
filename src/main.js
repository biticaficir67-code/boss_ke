import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import { notify } from './lib/notify.js';
import { refreshAuth } from './lib/auth.js';
import './styles.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/admin' },
    { path: '/admin/login', component: () => import('./views/LoginView.vue') },
    { path: '/admin', component: () => import('./views/AdminView.vue'), meta: { admin: true } },
    { path: '/preview', component: () => import('./views/PreviewView.vue'), meta: { admin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
router.beforeEach(async (to) => {
  if (!to.meta.admin) return;
  try {
    const status = await refreshAuth();
    if (!status.authenticated) return '/admin/login';
  } catch {
    return '/admin/login';
  }
});
router.onError((error) => {
  console.error('[page-load]', error);
  window.__showBootError?.(error);
  notify('页面加载失败，请刷新页面并检查网络连接', 'error');
});
const app = createApp(App).use(router);
router
  .isReady()
  .then(() => {
    app.mount('#app');
    window.__finishBoot?.();
  })
  .catch((error) => window.__showBootError?.(error));
