// 当前整套美术；旧 sample-art 仍保留，供历史版本恢复使用。
export const artwork = [
  {
    id: 'arrival',
    kind: 'scene',
    name: '夜雾邮局',
    src: '/artwork/arrival.webp',
    alt: '午夜的林间邮局，灰狼投递员提灯等候',
    caption: '01 / 夜雾邮局 · 概念视觉',
  },
  {
    id: 'forest-road',
    kind: 'scene',
    name: '迷途林道',
    src: '/artwork/forest-road.webp',
    alt: '雪豹收件人走进被迷雾遮蔽的森林小路',
    caption: '02 / 迷途林道 · 概念视觉',
  },
  {
    id: 'sorting-room',
    kind: 'scene',
    name: '午夜分拣室',
    src: '/artwork/sorting-room.webp',
    alt: '旧邮局分拣室的信格、油灯与未拆封的邮件',
    caption: '03 / 午夜分拣室 · 概念视觉',
  },
  {
    id: 'lighthouse',
    kind: 'scene',
    name: '雾岸灯塔',
    src: '/artwork/lighthouse.webp',
    alt: '海雾中的孤独灯塔与微亮的投递站',
    caption: '04 / 雾岸灯塔 · 概念视觉',
  },
  {
    id: 'dead-letter',
    kind: 'scene',
    name: '未投递的来信',
    src: '/artwork/dead-letter.webp',
    alt: '档案桌上的无署名信封、爪印蜡封与旧钥匙',
    caption: '05 / 未投递的来信 · 概念视觉',
  },
  {
    id: 'receiver',
    kind: 'character',
    name: '收件人 · 雪豹',
    src: '/artwork/receiver.webp',
    alt: '手持陌生信封的成年雪豹收件人',
  },
  {
    id: 'courier',
    kind: 'character',
    name: '夜班投递员 · 灰狼',
    src: '/artwork/courier.webp',
    alt: '身穿旧大衣、提着黄铜灯笼的成年灰狼投递员',
  },
];

export const sceneArtwork = artwork.filter((image) => image.kind === 'scene');
