import { reactive } from 'vue';
import { request, setCsrf } from './api.js';
export const auth = reactive({ authenticated: false, username: '', needsSetup: false, setupAllowed: true });
export function acceptAuth(data) { Object.assign(auth, data); setCsrf(data.csrf); }
export async function refreshAuth() { const data = await request('/api/auth/status'); acceptAuth(data); return data; }
