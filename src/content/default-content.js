import { defaultSections } from './sections.js';

export function defaultContent() {
  return {
    schemaVersion: 1,
    extra: defaultSections(),
    brand: {
      name: '未知的邮件',
      englishName: 'UNKNOWN MAIL',
      studio: '拾光工作室',
      contact: '',
    },
    hero: {
      eyebrow: '福瑞 · 微恐 · 悬疑叙事',
      title: '这封邮件，\n不该由你收到。',
      subtitle: '寄件人不存在，收件地址却是你的家。夜雾里，那座早已停业的邮局，又亮起了灯。',
      interval: 5500,
      slides: [
        {
          id: 'scene-1',
          src: '/sample-art/island.svg',
          alt: '暮色海面上，一座亮着灯的孤岛',
          caption: '01 / 在潮汐之间',
        },
        {
          id: 'scene-2',
          src: '/sample-art/forest.svg',
          alt: '星光落入幽静的森林与山谷',
          caption: '02 / 听见森林的呼吸',
        },
        {
          id: 'scene-3',
          src: '/sample-art/journey.svg',
          alt: '旅人沿着沙丘走向远方的遗迹',
          caption: '03 / 抵达故事的另一端',
        },
      ],
    },
    about: {
      eyebrow: '关于这段旅程',
      title: '每一封来信，\n都藏着另一种真相。',
      body: '一封没有署名的邮件，把你带回了地图上已经消失的小镇。潮湿的林间小路、停止走动的挂钟，还有那些似乎认识你的陌生身影——它们都在等待同一个收件人。\n\n拨开文字与记忆之间的迷雾，辨认同行者留下的痕迹。有些声音来自门外，有些则一直留在信封里面。',
      features: ['福瑞角色', '悬疑叙事', '轻度惊悚'],
    },
    download: {
      enabled: true,
      title: '午夜之前，\n请确认你的邮件。',
      description: '安装包由外部下载平台提供。投递通道开放后，可在此领取。',
      buttonText: '下载游戏',
      url: '',
      version: '待发布',
      platform: 'Windows / macOS',
      fileSize: '待填写',
      extractionCode: '',
    },
  };
}
