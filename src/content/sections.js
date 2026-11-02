// 新栏目与旧内容分离；缺少这些字段的历史版本仍然可以读取和恢复。
export function emptySections() {
  return {
    story: { enabled: false, subject: '', sender: '', body: '' },
    characters: [],
    gameplay: [],
    updates: [],
    faq: [],
    system: [],
    links: [],
  };
}

export function defaultSections() {
  return {
    story: {
      enabled: true,
      subject: '请在午夜之前，确认这封邮件。',
      sender: '发件人：未知 / 投递状态：已送达',
      body: '如果你正在读这封信，说明邮局还记得你的地址。\n\n不要相信门外第三次响起的敲门声。不要把信交给没有影子的投递员。最重要的是——在天亮之前，想起你为什么来到这里。\n\n信封里没有署名，只有一枚沾着潮气的爪印。',
    },
    characters: [
      {
        id: 'receiver',
        name: '收件人',
        role: '档案 01 · 身份待确认',
        quote: '信上写着我的名字，可我从未来过这里。',
        body: '带着一封陌生邮件踏入雾中的旅人。被擦去的寄件地址，似乎指向一段不属于自己的记忆。',
        image: '/artwork/receiver.webp',
      },
      {
        id: 'courier',
        name: '夜班投递员',
        role: '档案 02 · 投递记录缺失',
        quote: '有些邮件，最好永远不要拆开。',
        body: '总在熄灯之后出现的身影。他熟悉每一条林间小路，却从不回答关于旧邮局的问题。',
        image: '/artwork/courier.webp',
      },
    ],
    gameplay: [
      {
        id: 'clues',
        title: '循迹调查',
        body: '从信件、旧照片与场景细节中，寻找被刻意隐去的线索。',
      },
      { id: 'memory', title: '拼合记忆', body: '把零散的来信放在一起，读出同一段故事的不同侧面。' },
      {
        id: 'company',
        title: '辨认同行者',
        body: '听见他们的故事，也留意那些没有被说出口的部分。',
      },
    ],
    updates: [
      {
        id: 'first-letter',
        date: '2026-11-02',
        kind: '设定手记',
        title: '第一封，来自未知的邮件。',
        body: '夜雾、旧邮局，以及没有署名的来信。这里将陆续收录《未知的邮件》的设定草案、视觉资料与后续版本消息。',
      },
    ],
    faq: [
      {
        id: 'download',
        question: '现在可以下载吗？',
        answer: '以下载区的按钮状态为准。下载开放后，可通过官网入口前往对应下载平台。',
      },
      {
        id: 'platform',
        question: '支持什么平台？',
        answer: '请查看下载区的平台与配置说明。尚未公布的配置会在正式版本信息确认后更新。',
      },
      {
        id: 'install',
        question: '网盘下载后如何安装？',
        answer: '下载完整安装包后，按包内说明解压或安装；如有提取码，可在下载区点击复制。',
      },
    ],
    system: [
      { id: 'os', label: '操作系统', value: 'Windows，具体版本待公布' },
      { id: 'memory', label: '内存与显卡', value: '待正式配置公布' },
      { id: 'space', label: '存储空间', value: '以正式安装包说明为准' },
    ],
    links: [],
  };
}

// 角色图片也必须参与构建、导出和素材引用检查，避免删图或交付时漏图。
export function contentImages(content) {
  return [
    ...new Set([
      ...content.hero.slides.map((slide) => slide.src),
      ...(content.extra?.characters || []).map((character) => character.image).filter(Boolean),
    ]),
  ];
}
