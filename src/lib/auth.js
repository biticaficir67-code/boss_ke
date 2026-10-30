import { reactive } from 'vue';
import { request } from './api.js';

export const auth = reactive({ authenticated: false, username: '' });

export function acceptAuth(data) {
  Object.assign(auth, data);
}

export async function refreshAuth() {
  const data = await request('/api/auth/status');
  acceptAuth(data);
  return data;
}
