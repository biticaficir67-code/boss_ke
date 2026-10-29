<script setup>
defineProps({ name: String, size: { type: [Number, String], default: 20 } });
const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  edit: 'm16 3 5 5-12 12-6 1 1-6L16 3Z M13 6l5 5',
  image: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M3 16l6-6 5 5 3-3 4 4 M15 7h.01',
  download: 'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  external: 'M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7',
  save: 'M4 3h13l4 4v14H3V3h1Z M7 3v6h9V3 M7 21v-8h10v8',
  upload: 'M12 16V3 m-5 5 5-5 5 5 M3 16v5h18v-5',
  plus: 'M12 5v14 M5 12h14',
  check: 'm5 12 4 4L19 6',
  logout: 'M9 3H3v18h6 M9 12h12m-5-5 5 5-5 5',
  history: 'M3 11a9 9 0 1 1 3 7 M3 4v7h7 M12 7v5l3 2',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  close: 'm6 6 12 12M6 18 18 6',
  trash: 'M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  up: 'm6 14 6-6 6 6',
  down: 'm6 10 6 6 6-6',
  info: 'M12 8h.01 M12 11v6 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  lock: 'M6 10V7a6 6 0 0 1 12 0v3 M4 10h16v11H4Z M12 14v3',
  file: 'M14 2H4v20h16V8l-6-6Z M14 2v6h6 M8 13h8m-8 4h5',
};
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.grid" /></svg></template>
