<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import Icon from '../components/Icon.vue';
import { request } from '../lib/api.js';
import { auth, acceptAuth } from '../lib/auth.js';
import { notify } from '../lib/notify.js';
import { renderDocument } from '../site/render.js';
import { githubMode, githubConfig, websiteUrl, imageUrl, previewOptions } from '../lib/hosting.js';

const router = useRouter();
const tabs = [
  { id: 'overview', label: '内容概览', icon: 'grid', subtitle: '每一个新故事，都从这里开始。' },
  { id: 'content', label: '游戏介绍', icon: 'edit', subtitle: '让玩家认识你的游戏与世界。' },
  { id: 'carousel', label: '首页轮播', icon: 'image', subtitle: '用最动人的画面，留下第一印象。' },
  { id: 'download', label: '下载设置', icon: 'download', subtitle: '为玩家准备一个清楚、可靠的下载入口。' },
  { id: 'media', label: '图片素材', icon: 'file', subtitle: '整理画面，为下一次更新做好准备。' },
  { id: 'settings', label: '账号设置', icon: 'settings', subtitle: githubMode ? '管理你的发布授权。' : '管理你的工作台登录密码。' },
];
const tab = ref('overview');
const currentTab = computed(() => tabs.find(item => item.id === tab.value));
const form = ref(null);
const saved = ref('');
const meta = ref({});
const uploads = ref([]);
const history = ref([]);
const loading = ref(true);
const loadError = ref('');
const busy = ref('');
const uploadBusy = ref(false);
const uploadInput = ref();
const uploadForCarousel = ref(false);
const picker = ref(null);
const showHistory = ref(false);
const showSource = ref(false);
const confirmAction = ref(null);
const previewHtml = ref('');
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmation: '' });
const passwordError = ref('');
const unsaved = computed(() => !!form.value && JSON.stringify(form.value) !== saved.value);
const online = ref(false);
const statusText = computed(() => unsaved.value ? '有未保存修改' : meta.value.dirty ? '草稿待发布' : githubMode && !online.value ? '等待 GitHub 部署' : '已全部发布');
const actionsUrl = `https://github.com/${githubConfig.owner}/${githubConfig.repository}/actions/workflows/pages.yml`;
let deploymentTimer;
async function checkDeployment() { if (!githubMode || !meta.value.releaseId) return; const deployed = await request('/api/admin/deployment').catch(() => ({})); online.value = deployed.releaseId === meta.value.releaseId; }
const selectedImages = computed(() => form.value?.hero.slides.map(slide => slide.src) || []);
const samples = [
  { id: 'sample-island', name: '演示 · 潮汐孤岛', src: '/sample-art/island.svg', sample: true },
  { id: 'sample-forest', name: '演示 · 林间星光', src: '/sample-art/forest.svg', sample: true },
  { id: 'sample-journey', name: '演示 · 远行沙丘', src: '/sample-art/journey.svg', sample: true },
];
const allImages = computed(() => [...uploads.value, ...samples]);
const source = computed(() => form.value ? renderDocument(form.value) : '');
let previewTimer;
let unloadHandler;
function date(value) { return value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; }
function acceptDraft(data) { meta.value = data; form.value = structuredClone(data.content); saved.value = JSON.stringify(form.value); }
async function load() {
  loading.value = true; loadError.value = '';
  try { const [draft, images, releases] = await Promise.all([request('/api/admin/draft'), request('/api/admin/uploads'), request('/api/admin/history')]); acceptDraft(draft); uploads.value = images; history.value = releases; await checkDeployment(); }
  catch (error) { loadError.value = error.message; }
  finally { loading.value = false; }
}
onMounted(() => {
  document.title = '内容概览 · 游戏工作台';
  load();
  if (githubMode) deploymentTimer = setInterval(checkDeployment, 15000);
  unloadHandler = event => { if (unsaved.value) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', unloadHandler);
});
onUnmounted(() => { clearTimeout(previewTimer); clearInterval(deploymentTimer); window.removeEventListener('beforeunload', unloadHandler); document.body.style.overflow = ''; });
onBeforeRouteLeave(() => !unsaved.value || window.confirm('还有未保存的修改，确定离开吗？'));
watch(tab, () => { document.title = `${currentTab.value.label} · 游戏工作台`; });
watch(form, () => { clearTimeout(previewTimer); previewTimer = setTimeout(() => { if (form.value) previewHtml.value = renderDocument(form.value, previewOptions()); }, 220); }, { deep: true });
watch([picker, showHistory, showSource, confirmAction], () => { document.body.style.overflow = picker.value !== null || showHistory.value || showSource.value || confirmAction.value ? 'hidden' : ''; });
async function persist() {
  if (!unsaved.value) return;
  const result = await request('/api/admin/draft', { method: 'PUT', body: { content: form.value, expectedRevision: meta.value.revision } });
  acceptDraft(result);
}
async function save() {
  if (busy.value) return;
  busy.value = 'save';
  try { await persist(); notify('草稿已保存，正式官网尚未改变'); }
  catch (error) { notify(error.message, 'error'); }
  finally { busy.value = ''; }
}
async function publish() {
  if (busy.value) return;
  busy.value = 'publish';
  try { await persist(); acceptDraft(await request('/api/admin/publish', { method: 'POST', body: { expectedRevision: meta.value.revision } })); history.value = await request('/api/admin/history').catch(() => history.value); online.value = false; await checkDeployment(); notify(githubMode ? '已提交发布，GitHub 部署完成后官网生效' : '发布成功，官网 HTML 和图片已更新'); }
  catch (error) { notify(error.message, 'error'); }
  finally { busy.value = ''; }
}
async function downloadZip() {
  if (busy.value) return;
  busy.value = 'export';
  try {
    const blob = await request('/api/admin/export', { blob: true });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'game-website.zip'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('已导出已发布版本，可上传至静态托管平台');
  } catch (error) { notify(error.message, 'error'); }
  finally { busy.value = ''; }
}
function ask(title, body, action, danger = false) { confirmAction.value = { title, body, action, danger }; }
async function runConfirmed() {
  const action = confirmAction.value?.action; confirmAction.value = null;
  try { await action?.(); } catch (error) { notify(error.message, 'error'); }
}
function reloadDraft() { ask('重新载入草稿？', '这会放弃当前窗口尚未保存的修改，读取最近保存的内容。', load); }
function restore(release) {
  ask('将这个版本恢复到草稿？', '当前草稿会被替换。正式官网保持当前版本，需要再次点击发布才会更新。', async () => {
    busy.value = 'restore';
    try { acceptDraft(await request('/api/admin/restore', { method: 'POST', body: { id: release.id, expectedRevision: meta.value.revision } })); uploads.value = await request('/api/admin/uploads').catch(() => uploads.value); showHistory.value = false; notify('历史版本已恢复到草稿，检查后可重新发布'); }
    finally { busy.value = ''; }
  });
}
function moveSlide(index, direction) { const list = form.value.hero.slides; const destination = index + direction; if (destination < 0 || destination >= list.length) return; [list[index], list[destination]] = [list[destination], list[index]]; }
function removeSlide(index) { if (form.value.hero.slides.length <= 1) return notify('请至少保留一张轮播图', 'error'); form.value.hero.slides.splice(index, 1); }
function chooseImage(image) {
  if (picker.value === -1) {
    if (form.value.hero.slides.length >= 8) return notify('最多添加 8 张轮播图', 'error');
    form.value.hero.slides.push({ id: crypto.randomUUID(), src: image.src, alt: image.name.replace(/\.[^.]+$/, ''), caption: '' });
  } else form.value.hero.slides[picker.value].src = image.src;
  picker.value = null;
}
function startUpload(addToCarousel = false) { uploadForCarousel.value = addToCarousel; uploadInput.value?.click(); }
async function prepareImage(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
  if (file.size > 20 * 1024 * 1024) throw new Error('原图不能超过 20MB，请先缩小后再上传');
  const bitmap = await createImageBitmap(file);
  if (bitmap.width * bitmap.height > 40000000) { bitmap.close(); throw new Error('图片尺寸过大，请先缩小到 4000 万像素以内'); }
  const ratio = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.85));
  if (!blob || blob.size > 3 * 1024 * 1024) throw new Error('压缩后的图片仍超过 3MB，请使用更小的图片');
  const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
  return { name: file.name, data: base64 };
}
async function uploadFiles(event) {
  const files = [...event.target.files]; event.target.value = '';
  if (!files.length || uploadBusy.value) return;
  uploadBusy.value = true;
  try {
    for (const file of files) {
      const image = await request('/api/admin/uploads', { method: 'POST', body: await prepareImage(file) }); uploads.value.unshift(image);
      if (uploadForCarousel.value && form.value.hero.slides.length < 8) form.value.hero.slides.push({ id: crypto.randomUUID(), src: image.src, alt: file.name.replace(/\.[^.]+$/, ''), caption: '' });
    }
    notify(uploadForCarousel.value ? '图片已上传，轮播修改请保存后发布' : '图片已添加到素材库');
  } catch (error) { notify(error.message || '图片上传失败，请重试', 'error'); }
  finally { uploadBusy.value = false; }
}
function deleteImage(image) {
  ask('删除这张素材？', '删除后将从素材库移除。仍被草稿、官网或历史版本使用的图片无法删除。', async () => { await request(`/api/admin/uploads/${image.id}`, { method: 'DELETE' }); uploads.value = uploads.value.filter(item => item.id !== image.id); notify('图片已删除'); }, true);
}
async function changePassword() {
  passwordError.value = '';
  if (unsaved.value) { passwordError.value = '请先保存或放弃内容修改，再更新密码'; return; }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmation) { passwordError.value = '两次新密码不一致'; return; }
  busy.value = 'password';
  try { await request('/api/auth/password', { method: 'POST', body: passwordForm.value }); acceptAuth({ authenticated: false, csrf: '', username: '' }); notify('密码已更新，请使用新密码登录'); await router.replace('/admin/login'); }
  catch (error) { passwordError.value = error.message; }
  finally { busy.value = ''; }
}
async function logout() {
  if (unsaved.value && !window.confirm('还有未保存的修改，确定退出吗？')) return;
  try { await request('/api/auth/logout', { method: 'POST', body: {} }); saved.value = JSON.stringify(form.value); acceptAuth({ authenticated: false, csrf: '', username: '' }); await router.replace('/admin/login'); }
  catch (error) { notify(error.message, 'error'); }
}
async function copySource() { try { await navigator.clipboard.writeText(source.value); notify('HTML 源码已复制'); } catch { notify('无法访问剪贴板，请在代码框内手动复制', 'error'); } }
function onEscape(event) { if (event.key === 'Escape') { picker.value = null; showHistory.value = false; showSource.value = false; confirmAction.value = null; } }
onMounted(() => window.addEventListener('keydown', onEscape));
onUnmounted(() => window.removeEventListener('keydown', onEscape));
</script>

<template>
  <div class="workspace">
    <aside class="sidebar"><RouterLink class="workspace-logo" to="/"><span class="workspace-logo-icon">✦</span><span>游戏工作台<small>GAME WEBSITE STUDIO</small></span></RouterLink><div class="sidebar-site"><span class="site-avatar">{{ form?.brand.name?.slice(0, 1) || '游' }}</span><div><strong>{{ form?.brand.name || '我的游戏官网' }}</strong><span>独立游戏官网</span></div><span class="sidebar-site-dot"></span></div><p class="sidebar-label">内容管理</p><nav aria-label="后台导航"><button v-for="item in tabs.slice(0, 5)" :key="item.id" :class="{ active: tab === item.id }" @click="tab = item.id"><Icon :name="item.icon" :size="18" />{{ item.label }}<span v-if="item.id === 'carousel' && form" class="nav-count">{{ form.hero.slides.length }}</span></button></nav><div class="sidebar-bottom"><div class="sidebar-note"><span>✧</span><p>让好故事，<br>被更多人看见。</p></div><button :class="{ active: tab === 'settings' }" @click="tab = 'settings'"><Icon name="settings" :size="18" />账号设置</button><div class="sidebar-user"><span>{{ auth.username.slice(0, 1).toUpperCase() }}</span><div><strong>{{ auth.username }}</strong><small>网站管理员</small></div><button aria-label="退出登录" title="退出登录" @click="logout"><Icon name="logout" :size="18" /></button></div></div></aside>
    <div class="workspace-main"><header class="workspace-topbar"><div class="breadcrumb">我的官网 <span>/</span><strong>{{ currentTab.label }}</strong></div><a class="button small ghost" :href="websiteUrl" target="_blank" rel="noopener"><Icon name="external" :size="15" />查看官网</a></header><div class="mobile-nav"><button v-for="item in tabs" :key="item.id" :class="{ active: tab === item.id }" @click="tab = item.id">{{ item.label }}</button></div>
      <main class="workspace-content"><div class="page-heading"><div><p class="eyebrow">YOUR CREATIVE SPACE</p><h1>{{ currentTab.label }}</h1><p class="muted">{{ currentTab.subtitle }}</p></div><div v-if="form && !['media', 'settings'].includes(tab)" class="heading-actions"><span class="save-status" :class="{ pending: unsaved || meta.dirty }"><i></i>{{ statusText }}</span><button class="button" :disabled="!!busy || uploadBusy || !unsaved" @click="save"><Icon name="save" :size="16" />{{ busy === 'save' ? '保存中…' : '保存草稿' }}</button><button class="button primary" :disabled="!!busy || uploadBusy" @click="publish"><Icon name="upload" :size="16" />{{ busy === 'publish' ? '发布中…' : '发布官网' }}</button></div></div>
      <div v-if="loading" class="panel center-state"><span class="loading-dot"></span><p>正在载入你的工作台…</p></div><div v-else-if="loadError" class="panel center-state"><h2>暂时无法载入内容</h2><p class="muted">{{ loadError }}</p><button class="button primary" @click="load">重新载入</button></div>
      <template v-else-if="form">
        <template v-if="tab === 'overview'">
          <section class="welcome-banner"><div><span class="welcome-tag">为下一次更新，留一点灵感</span><h2>把新故事，<br>带到玩家面前。</h2><p>更新一段介绍，换上一张新画面。<br>你的世界，正在等待被发现。</p><button class="button dark" @click="tab = 'content'">开始编辑<Icon name="arrow" :size="17" /></button></div><div class="welcome-art" aria-hidden="true"><div class="welcome-orbit orbit-one"></div><div class="welcome-orbit orbit-two"></div><div class="welcome-spark">✧</div><div class="art-card art-card-back"></div><div class="art-card art-card-front"><img :src="imageUrl('/sample-art/island.svg')" alt=""><span>LETTERS TO THE WORLD</span></div><span class="welcome-star star-one">✦</span><span class="welcome-star star-two">✦</span></div></section>
          <div class="overview-stats"><div class="stat-card"><span class="stat-icon green"><Icon name="check" /></span><div><span>官网状态</span><strong>{{ meta.dirty ? '有草稿待发布' : githubMode && !online ? '等待部署' : '已发布' }}</strong><small>最近发布 {{ date(meta.publishedAt) }}</small></div></div><div class="stat-card"><span class="stat-icon peach"><Icon name="image" /></span><div><span>首页轮播</span><strong>{{ form.hero.slides.length }} <em>张画面</em></strong><small>每 {{ form.hero.interval / 1000 }} 秒自动切换</small></div></div><div class="stat-card"><span class="stat-icon lilac"><Icon name="download" /></span><div><span>下载入口</span><strong>{{ !form.download.enabled ? '已隐藏' : form.download.url ? '已配置' : '待配置' }}</strong><small>{{ form.download.url ? form.download.version || '未填写版本号' : '填写外部下载地址即可开放' }}</small></div></div></div>
          <div class="overview-bottom"><section class="panel quick-edit"><div class="panel-heading"><div><h2>让官网准备就绪</h2><p>三个简单步骤，完成你的第一次发布。</p></div><span class="tag">快速开始</span></div><button class="quick-row" @click="tab = 'content'"><span class="step-number">01</span><div><strong>介绍你的游戏</strong><p>修改游戏名称、主标题与故事简介</p></div><Icon name="arrow" :size="18" /></button><button class="quick-row" @click="tab = 'carousel'"><span class="step-number">02</span><div><strong>上传游戏画面</strong><p>选择轮播图，调整播放顺序和间隔</p></div><Icon name="arrow" :size="18" /></button><button class="quick-row" @click="tab = 'download'"><span class="step-number">03</span><div><strong>连接下载入口</strong><p>粘贴游戏包链接，填写版本与安装说明</p></div><Icon name="arrow" :size="18" /></button></section><section class="panel publish-panel"><div class="panel-heading"><div><h2>发布与交付</h2><p>把完成的内容交给玩家。</p></div><Icon name="upload" :size="19" /></div><div class="publication-date"><span class="status-badge"><i></i>{{ githubMode ? online ? '正式官网已上线' : '已提交，等待部署' : '正式官网已生成' }}</span><strong>{{ date(meta.publishedAt) }}</strong><small>草稿版本 {{ meta.revision }} · 已发布版本 {{ meta.publishedRevision }}</small></div><a v-if="githubMode" class="utility-row" :href="actionsUrl" target="_blank" rel="noopener noreferrer"><Icon name="external" :size="17"/><span>查看部署进度</span><span>↗</span></a><button class="utility-row" @click="showHistory = true"><Icon name="history" :size="17" /><span>查看发布记录</span><span>↗</span></button><button class="utility-row" :disabled="!!busy" @click="downloadZip"><Icon name="download" :size="17" /><span>{{ busy === 'export' ? '正在打包…' : '导出静态网站 ZIP' }}</span><span>↗</span></button><button class="utility-row" @click="showSource = true"><Icon name="code" :size="17" /><span>查看生成的 HTML</span><span>↗</span></button></section></div>
          <div v-if="githubMode" class="notice"><Icon name="info" :size="17"/><p>保存草稿不会更新正式官网。点击发布后，GitHub 会自动部署；本页会确认官网是否已更新。仓库公开，草稿和素材也可被查看，请勿填写密码或私人资料。</p></div><div class="notice demo-notice"><Icon name="info" :size="17" /><p>“雾海来信”和配图为本地演示素材。请换成真实游戏内容后再对外发布。静态 ZIP 只包含公开网页与图片，不包含账号或管理后台。</p></div>
        </template>
        <div v-else-if="['content', 'carousel', 'download'].includes(tab)" class="editor-layout"><div class="editor-panels" :inert="!!busy || uploadBusy">
          <template v-if="tab === 'content'"><section class="panel form-panel"><div class="panel-heading"><div><h2>游戏基本信息</h2><p>用于导航栏、网页标题和页脚。</p></div><Icon name="edit" :size="18" /></div><div class="field-grid"><label>游戏名称<input v-model="form.brand.name" maxlength="30" placeholder="填写你的游戏名称"></label><label>英文名称<input v-model="form.brand.englishName" maxlength="80" placeholder="可选"></label><label>工作室名称<input v-model="form.brand.studio" maxlength="50"></label><label>联系信息<input v-model="form.brand.contact" maxlength="100" placeholder="邮箱或其他公开联系方式，可选"></label></div></section><section class="panel form-panel"><div class="panel-heading"><div><h2>首页文案</h2><p>展现在顶部轮播图上，主标题支持换行。</p></div></div><label>顶部小标题<input v-model="form.hero.eyebrow" maxlength="60"></label><label>首页主标题<textarea v-model="form.hero.title" rows="3" maxlength="100"></textarea></label><label>首页副标题<textarea v-model="form.hero.subtitle" rows="3" maxlength="400"></textarea></label></section><section class="panel form-panel"><div class="panel-heading"><div><h2>游戏介绍</h2><p>介绍玩法、故事或你想让玩家了解的内容。</p></div></div><label>介绍区小标题<input v-model="form.about.eyebrow" maxlength="40"></label><label>介绍区标题<textarea v-model="form.about.title" rows="2" maxlength="100"></textarea></label><label>游戏简介<textarea v-model="form.about.body" rows="8" maxlength="6000"></textarea><small>使用空行分段，按纯文字显示，支持换行。</small></label><div class="field-label">游戏特点 <span>最多 6 项</span></div><div class="feature-inputs"><div v-for="(_, index) in form.about.features" :key="index"><input v-model="form.about.features[index]" maxlength="24" :aria-label="`游戏特点 ${index + 1}`"><button class="icon-button" :aria-label="`删除游戏特点 ${index + 1}`" @click="form.about.features.splice(index, 1)"><Icon name="close" :size="16" /></button></div></div><button class="button small ghost" :disabled="form.about.features.length >= 6" @click="form.about.features.push('')"><Icon name="plus" :size="16" />添加特点</button></section></template>
          <template v-if="tab === 'carousel'"><section class="panel form-panel"><div class="panel-heading"><div><h2>轮播设置</h2><p>建议使用同一比例的横图，最多 8 张。</p></div><span class="tag">{{ form.hero.slides.length }} / 8</span></div><label>自动切换间隔<select v-model.number="form.hero.interval"><option :value="3000">3 秒</option><option :value="4000">4 秒</option><option :value="5000">5 秒</option><option :value="5500">5.5 秒</option><option :value="6000">6 秒</option><option :value="8000">8 秒</option><option :value="10000">10 秒</option><option :value="15000">15 秒</option></select></label><div class="notice"><Icon name="info" :size="16" /><p>图片会自动压缩到最长边 2400 像素。正式官网支持暂停、手动切换和键盘方向键。</p></div></section><section v-for="(slide, index) in form.hero.slides" :key="slide.id" class="panel slide-editor"><div class="slide-toolbar"><strong><span>{{ String(index + 1).padStart(2, '0') }}</span>轮播画面</strong><div><button class="icon-button" :disabled="index === 0" aria-label="上移图片" @click="moveSlide(index, -1)"><Icon name="up" :size="17" /></button><button class="icon-button" :disabled="index === form.hero.slides.length - 1" aria-label="下移图片" @click="moveSlide(index, 1)"><Icon name="down" :size="17" /></button><button class="icon-button danger" :disabled="form.hero.slides.length <= 1" aria-label="移除轮播图" @click="removeSlide(index)"><Icon name="trash" :size="16" /></button></div></div><button class="slide-image" @click="picker = index"><img :src="imageUrl(slide.src)" :alt="slide.alt"><span><Icon name="image" :size="17" />更换图片</span></button><div class="slide-fields"><label>图片描述<input v-model="slide.alt" maxlength="150" placeholder="描述画面，帮助无法看到图片的访客"></label><label>图片角标<input v-model="slide.caption" maxlength="80" placeholder="例如 01 / 游戏实机画面"></label></div></section><div class="add-slide-actions"><button class="button" :disabled="uploadBusy || form.hero.slides.length >= 8" @click="startUpload(true)"><Icon name="upload" :size="17" />{{ uploadBusy ? '图片处理中…' : '上传并添加图片' }}</button><button class="button ghost" :disabled="form.hero.slides.length >= 8" @click="picker = -1"><Icon name="plus" :size="17" />从素材库添加</button></div></template>
          <template v-if="tab === 'download'"><section class="panel form-panel"><div class="panel-heading"><div><h2>下载入口</h2><p>官网只提供链接，安装包保留在外部下载平台。</p></div><label class="switch-label"><input v-model="form.download.enabled" type="checkbox" role="switch" aria-label="显示下载区域"><span class="switch"></span></label></div><p class="field-hint">{{ form.download.enabled ? '下载区域已显示。没有填写链接时，按钮会显示“下载即将开放”。' : '下载区域已隐藏，首页导航与按钮也会同步隐藏。' }}</p><label>下载地址<input v-model="form.download.url" type="url" maxlength="2000" placeholder="https://…"><small>填写 HTTPS 链接。网盘链接会打开分享页，直链由目标平台决定是否直接下载。</small></label><div class="field-grid"><label>版本号<input v-model="form.download.version" maxlength="40" placeholder="例如 v1.0.0"></label><label>支持平台<input v-model="form.download.platform" maxlength="80" placeholder="例如 Windows 10 / 11"></label><label>文件大小<input v-model="form.download.fileSize" maxlength="40" placeholder="例如 850 MB"></label><label>提取码<input v-model="form.download.extractionCode" maxlength="40" placeholder="网盘提取码，可选"></label></div><label>下载按钮文字<input v-model="form.download.buttonText" maxlength="20"></label></section><section class="panel form-panel"><div class="panel-heading"><div><h2>下载区文案</h2><p>告诉玩家如何开始这段旅程。</p></div></div><label>下载区标题<textarea v-model="form.download.title" rows="3" maxlength="100"></textarea></label><label>下载说明<textarea v-model="form.download.description" rows="5" maxlength="2000" placeholder="填写运行环境、安装方式或版本说明"></textarea></label></section></template>
          <div class="editor-bottom-actions"><button class="button small ghost" @click="showSource = true"><Icon name="code" :size="16" />查看 HTML</button><button class="button small ghost" :disabled="!!busy" @click="reloadDraft"><Icon name="history" :size="16" />重新载入草稿</button></div>
        </div><aside class="preview-panel"><div class="preview-title"><span><i></i>实时预览</span><RouterLink to="/preview" target="_blank" title="打开已保存草稿预览"><Icon name="external" :size="15" /></RouterLink></div><div class="preview-device"><div class="preview-device-bar"><span></span><i></i></div><iframe v-if="previewHtml" :srcdoc="previewHtml" title="当前编辑内容的手机预览" sandbox="allow-scripts allow-same-origin"></iframe></div><p>预览跟随输入更新。<br>保存草稿后可打开完整预览，发布后官网生效。</p></aside></div>
        <template v-else-if="tab === 'media'"><section class="media-toolbar"><div><strong>{{ uploads.length }} 张上传素材</strong><p class="muted">支持 JPG、PNG、WebP，上传时自动压缩。</p></div><button class="button primary" :disabled="uploadBusy" @click="startUpload(false)"><Icon name="upload" :size="17" />{{ uploadBusy ? '图片处理中…' : '上传图片' }}</button></section><div v-if="!uploads.length" class="panel empty-media"><span><Icon name="image" :size="34" /></span><h2>把你的世界，放进这里。</h2><p>上传第一张游戏画面，再到“首页轮播”中选用。</p><button class="button" :disabled="uploadBusy" @click="startUpload(false)">选择本地图片</button></div><div class="media-grid"><article v-for="image in uploads" :key="image.id" class="panel media-card"><img :src="imageUrl(image.src)" :alt="image.name"><div><strong :title="image.name">{{ image.name }}</strong><span>{{ (image.bytes / 1024).toFixed(0) }} KB · {{ date(image.createdAt) }}</span><div><span class="tag" v-if="selectedImages.includes(image.src)">草稿正在使用</span><button class="icon-button danger" :aria-label="`删除 ${image.name}`" @click="deleteImage(image)"><Icon name="trash" :size="16" /></button></div></div></article></div><div class="section-subheading"><h2>内置演示素材</h2><p>这些插画仅用于演示，可从轮播素材选择器中使用。</p></div><div class="media-grid"><article v-for="image in samples" :key="image.id" class="panel media-card"><img :src="imageUrl(image.src)" :alt="image.name"><div><strong>{{ image.name }}</strong><span>项目内置 SVG 插画</span></div></article></div></template>
        <template v-else-if="tab === 'settings' && githubMode"><section class="panel form-panel"><h2>发布授权</h2><p>当前仓库：{{ githubConfig.owner }}/{{ githubConfig.repository }}</p><p>使用发布密钥授权，不使用本地后台密码。密钥只保留在当前标签页会话中；需要更换时退出后重新授权。</p><p>日常修改内容、上传图片和发布均在这个工作台完成。发布后请等待 GitHub 自动部署，状态显示“正式官网已上线”后再分享新版。</p><a class="button" :href="actionsUrl" target="_blank" rel="noopener noreferrer">查看部署记录</a><button class="button" @click="logout">退出授权</button></section></template><template v-else-if="tab === 'settings'"><div class="settings-layout"><section class="panel form-panel"><div class="panel-heading"><div><h2>修改登录密码</h2><p>当前管理员：{{ auth.username }}。修改后需要重新登录。</p></div><Icon name="lock" :size="20" /></div><form @submit.prevent="changePassword"><label>当前密码<input v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" required maxlength="128"></label><label>新密码<input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" required minlength="10" maxlength="128"><small>至少 10 个字符。</small></label><label>确认新密码<input v-model="passwordForm.confirmation" type="password" autocomplete="new-password" required minlength="10" maxlength="128"></label><p v-if="passwordError" class="form-error" role="alert">{{ passwordError }}</p><button class="button primary" :disabled="!!busy">{{ busy === 'password' ? '正在更新…' : '更新密码' }}</button></form></section><section class="panel account-note"><span class="stat-icon peach"><Icon name="info" /></span><h2>关于你的工作台</h2><p>当前为单管理员模式，没有公开注册入口。</p><p>账号、草稿、上传图片与发布记录保存在本地 <code>.data</code> 目录。请定期备份整个目录。</p><p>静态网站 ZIP 可以独立托管；后台需要 Node.js 服务运行。</p><button class="button small" @click="logout"><Icon name="logout" :size="16" />退出登录</button></section></div></template>
      </template><footer class="workspace-footer"><span>✦ 为独立创作留一片空间</span><span>本地内容工作台 · Vue 3</span></footer></main>
    </div><input ref="uploadInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple @change="uploadFiles">
    <div v-if="picker !== null" class="modal-backdrop" @click.self="picker = null"><section class="modal image-picker" role="dialog" aria-modal="true" aria-labelledby="picker-title" tabindex="-1"><header><div><h2 id="picker-title">选择轮播画面</h2><p>选择上传素材或内置演示插画。</p></div><button class="icon-button" aria-label="关闭图片选择器" @click="picker = null"><Icon name="close" /></button></header><div class="picker-grid"><button v-for="image in allImages" :key="image.id" @click="chooseImage(image)"><img :src="imageUrl(image.src)" :alt="image.name"><span>{{ image.name }}</span></button></div><footer><button class="button" :disabled="uploadBusy" @click="startUpload(false)"><Icon name="upload" :size="16" />{{ uploadBusy ? '图片处理中…' : '上传新图片' }}</button><button class="button ghost" @click="picker = null">取消</button></footer></section></div>
    <div v-if="showHistory" class="modal-backdrop" @click.self="showHistory = false"><section class="modal history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title"><header><div><h2 id="history-title">发布记录</h2><p>恢复到草稿后，检查内容并再次发布。</p></div><button class="icon-button" aria-label="关闭发布记录" @click="showHistory = false"><Icon name="close" /></button></header><div class="history-list"><article v-for="(release, index) in history" :key="release.id"><span class="history-dot"></span><div><strong>{{ release.name }}</strong><p>{{ date(release.createdAt) }} · 草稿版本 {{ release.revision }}</p><small v-if="index === 0" class="tag">当前发布版本</small></div><button class="button small" :disabled="!!busy" @click="restore(release)">恢复到草稿</button></article></div></section></div>
    <div v-if="showSource" class="modal-backdrop" @click.self="showSource = false"><section class="modal source-modal" role="dialog" aria-modal="true" aria-labelledby="source-title"><header><div><h2 id="source-title">生成的静态 HTML</h2><p>根据当前编辑内容实时生成，发布后写入实际文件。脚本、样式与图片包含在导出 ZIP 中。</p></div><button class="icon-button" aria-label="关闭源码" @click="showSource = false"><Icon name="close" /></button></header><pre tabindex="0"><code>{{ source }}</code></pre><footer><button class="button primary" @click="copySource"><Icon name="code" :size="16" />复制 HTML</button><button class="button" :disabled="!!busy" @click="downloadZip">导出已发布官网</button></footer></section></div>
    <div v-if="confirmAction" class="modal-backdrop confirmation-layer" @click.self="confirmAction = null"><section class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><header><h2 id="confirm-title">{{ confirmAction.title }}</h2><button class="icon-button" aria-label="取消" @click="confirmAction = null"><Icon name="close" /></button></header><p>{{ confirmAction.body }}</p><footer><button class="button" @click="confirmAction = null">取消</button><button class="button" :class="confirmAction.danger ? 'destructive' : 'primary'" @click="runConfirmed">确认</button></footer></section></div>
  </div>
</template>
