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
      eyebrow: '一场写给远方的独立冒险',
      title: '越过雾海，\n寻找世界的回音。',
      subtitle: '带上一封没有署名的信，驶向被遗忘的群岛。在潮汐与星光之间，发现属于你的故事。',
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
      title: '世界很大，\n每一次相遇都有回响。',
      body: '这是一份用于演示官网功能的虚构游戏介绍。你将在这里展示真正的游戏故事、玩法与创作理念。\n\n探索迷雾中的岛屿，收集散落的信件，与沿途的角色相遇。放慢脚步，让好奇心带你走向下一处风景。',
      features: ['自由探索', '叙事冒险', '温柔的手绘世界'],
    },
    download: {
      enabled: true,
      title: '下一封来信，\n等你亲手打开。',
      description: '在这里填写版本介绍、运行要求或安装说明。安装包由你的下载平台提供。',
      buttonText: '下载游戏',
      url: '',
      version: '待发布',
      platform: 'Windows / macOS',
      fileSize: '待填写',
      extractionCode: '',
    },
  };
}
