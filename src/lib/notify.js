import { reactive } from 'vue';
export const notification = reactive({ message: '', type: 'success' });
let timer;
export function notify(message, type = 'success') { clearTimeout(timer); notification.message = message; notification.type = type; timer = setTimeout(() => notification.message = '', type === 'error' ? 7000 : 3500); }
