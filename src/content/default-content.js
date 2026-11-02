export function defaultContent() {
  return {
    schemaVersion: 1,
    brand: {
      name: '雾海来信',
      englishName: 'LETTERS FROM THE MIST',
      studio: '拾光工作室',
      contact: '',
    },
    hero: {
      eyebrow: '福瑞 · 独立叙事冒险',
      title: '越过雾海，\n与你温柔相遇。',
      subtitle: '一封来信，一次相遇。和毛茸茸的旅伴一起，走进雾海彼端的故事。',
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
      title: '故事的另一端，\n是与你相遇的世界。',
      body: '雾海之间，藏着尚未寄出的信，也藏着等待被听见的心事。循着微光出发，与沿途的旅伴相识，让每一次相遇成为故事的一部分。\n\n探索迷雾中的岛屿，收集散落的信件，与沿途的角色相遇。放慢脚步，让好奇心带你走向下一处风景。',
      features: ['福瑞角色', '叙事冒险', '自由探索'],
    },
    download: {
      enabled: true,
      title: '下一封来信，\n等你亲手打开。',
      description: '下一段旅程，期待与你一起出发。',
      buttonText: '下载游戏',
      url: '',
      version: '待发布',
      platform: 'Windows / macOS',
      fileSize: '待填写',
      extractionCode: '',
    },
  };
}
