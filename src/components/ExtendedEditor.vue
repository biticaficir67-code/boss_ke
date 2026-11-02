<script setup>
import Icon from './Icon.vue';
import { imageUrl } from '../lib/hosting.js';
const content = defineModel({ required: true });
defineProps({ mode: String, images: { type: Array, default: () => [] } });
const defaults = {
  characters: { name: '', role: '', quote: '', body: '', image: '' },
  gameplay: { title: '', body: '' },
  updates: { date: new Date().toLocaleDateString('en-CA'), kind: '开发日志', title: '', body: '' },
  faq: { question: '', answer: '' },
  system: { label: '', value: '' },
  links: { label: '', url: '' },
};
function add(key) {
  content.value.extra[key].push({ id: crypto.randomUUID(), ...defaults[key] });
}
function move(key, index, direction) {
  const list = content.value.extra[key];
  const next = index + direction;
  if (next >= 0 && next < list.length) [list[index], list[next]] = [list[next], list[index]];
}
const groups = {
  world: [
    {
      key: 'characters',
      title: '角色档案',
      max: 6,
      fields: [
        ['name', '角色名称', 30],
        ['role', '角色身份', 80],
        ['quote', '角色引语', 160],
        ['body', '角色介绍', 1200, 'textarea'],
      ],
    },
    {
      key: 'gameplay',
      title: '玩法介绍',
      max: 6,
      fields: [
        ['title', '玩法标题', 40],
        ['body', '玩法介绍', 500, 'textarea'],
      ],
    },
  ],
  updates: [
    {
      key: 'updates',
      title: '官网动态',
      max: 20,
      fields: [
        ['date', '动态日期', 10, 'date'],
        ['kind', '动态分类', 20],
        ['title', '动态标题', 100],
        ['body', '动态正文', 3000, 'textarea'],
      ],
    },
    {
      key: 'faq',
      title: '常见问题',
      max: 12,
      fields: [
        ['question', '问题', 120],
        ['answer', '回答', 2000, 'textarea'],
      ],
    },
  ],
  download: [
    {
      key: 'system',
      title: '配置说明',
      max: 8,
      fields: [
        ['label', '配置项目', 40],
        ['value', '配置内容', 200],
      ],
    },
    {
      key: 'links',
      title: '外部链接',
      max: 8,
      fields: [
        ['label', '链接名称', 30],
        ['url', 'HTTPS 链接', 2000, 'url'],
      ],
    },
  ],
};
</script>
<template>
  <section v-if="mode === 'world'" class="panel form-panel">
    <div class="panel-heading">
      <h2>剧情来信</h2>
      <label class="switch-label"
        ><input
          v-model="content.extra.story.enabled"
          type="checkbox"
          role="switch"
          aria-label="显示剧情来信" /><span class="switch"></span
      ></label>
    </div>
    <label>来信标题<input v-model="content.extra.story.subject" maxlength="100" /></label>
    <label>发件信息<input v-model="content.extra.story.sender" maxlength="100" /></label>
    <label
      >来信正文<textarea v-model="content.extra.story.body" rows="8" maxlength="4000"></textarea>
    </label>
  </section>
  <section v-for="group in groups[mode]" :key="group.key" class="panel form-panel extended-group">
    <div class="panel-heading">
      <h2>{{ group.title }}</h2>
      <span class="tag">{{ content.extra[group.key].length }} / {{ group.max }}</span>
    </div>
    <p v-if="!content.extra[group.key].length" class="muted">暂无条目，官网将隐藏此栏目。</p>
    <article v-for="(item, index) in content.extra[group.key]" :key="item.id" class="extended-item">
      <header>
        <strong>{{ String(index + 1).padStart(2, '0') }}</strong>
        <div>
          <button
            class="icon-button"
            :disabled="index === 0"
            :aria-label="`上移${group.title} ${index + 1}`"
            @click="move(group.key, index, -1)"
          >
            <Icon name="up" :size="16" />
          </button>
          <button
            class="icon-button"
            :disabled="index === content.extra[group.key].length - 1"
            :aria-label="`下移${group.title} ${index + 1}`"
            @click="move(group.key, index, 1)"
          >
            <Icon name="down" :size="16" />
          </button>
          <button
            class="icon-button danger"
            :aria-label="`删除${group.title} ${index + 1}`"
            @click="content.extra[group.key].splice(index, 1)"
          >
            <Icon name="trash" :size="16" />
          </button>
        </div>
      </header>
      <label v-for="[key, label, max, type] in group.fields" :key="key"
        >{{ label }}
        <textarea
          v-if="type === 'textarea'"
          v-model="item[key]"
          :maxlength="max"
          rows="4"
        ></textarea>
        <input v-else v-model="item[key]" :type="type || 'text'" :maxlength="max" />
      </label>
      <template v-if="group.key === 'characters'">
        <label
          >角色图片<select v-model="item.image" aria-label="角色图片">
            <option value="">不显示图片</option>
            <option v-for="image in images" :key="image.id" :value="image.src">
              {{ image.name }}
            </option>
          </select></label
        >
        <img
          v-if="item.image"
          class="extended-image"
          :src="imageUrl(item.image)"
          :alt="item.name"
        />
      </template>
    </article>
    <button
      class="button small"
      :disabled="content.extra[group.key].length >= group.max"
      @click="add(group.key)"
    >
      <Icon name="plus" :size="16" />添加{{ group.title }}
    </button>
  </section>
</template>
<style scoped>
.extended-item {
  border-top: 1px solid #d8ddd2;
  padding-top: 20px;
  margin-top: 20px;
}
.extended-item > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.extended-item > header strong {
  color: #a6a38c;
  font-size: 12px;
  font-family: monospace;
}
.extended-image {
  max-width: 100%;
  max-height: 240px;
  display: block;
  border-radius: 5px;
  margin-bottom: 20px;
  object-fit: contain;
}
</style>
