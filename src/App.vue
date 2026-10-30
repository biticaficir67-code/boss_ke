<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { notification, notify } from './lib/notify.js';
const router = useRouter();
const expired = () => {
  notify('登录已过期，请重新登录', 'error');
  router.replace('/admin/login');
};
onMounted(() => window.addEventListener('session-expired', expired));
onUnmounted(() => window.removeEventListener('session-expired', expired));
</script>
<template>
  <RouterView /><Transition name="toast"
    ><div
      v-if="notification.message"
      class="app-toast"
      :class="notification.type"
      role="status"
      aria-live="polite"
    >
      {{ notification.message }}
    </div></Transition
  >
</template>
