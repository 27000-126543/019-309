import { Incident, SyncTemplate } from '@/types/sentiment';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

export const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: '午盘热搜：网传公司产品质量抽检不合格',
    category: 'media',
    urgency: 'critical',
    summary: '微博财经、今日头条等多平台出现公司产品抽检不合格报道，话题#某品牌质量门#热度快速攀升，午盘后已进入热搜前30。',
    heat: 8720,
    heatTrend: 'rising',
    trendPoints: [
      { time: '09:30', value: 320 },
      { time: '10:00', value: 680 },
      { time: '10:30', value: 1240 },
      { time: '11:00', value: 2180 },
      { time: '11:30', value: 3560 },
      { time: '13:00', value: 5820 },
      { time: '13:30', value: 8720 }
    ],
    evidenceImages: [
      { id: 'E1', url: 'https://picsum.photos/id/1/600/400', caption: '微博热搜截图' },
      { id: 'E2', url: 'https://picsum.photos/id/2/600/400', caption: '财经号转发截图' }
    ],
    keyComments: [
      { id: 'C1', author: '财经观察人', content: '刚看到抽检报告，这批次问题不小啊，大家注意避坑。', platform: '微博', time: hoursAgo(2.5), likes: 432 },
      { id: 'C2', author: '消费者维权站', content: '有没有买过这批货的朋友？一起来维权。', platform: '今日头条', time: hoursAgo(1.8), likes: 218 }
    ],
    suspectedSource: '某地方市场监管局官网一则不起眼的公示（3天前发布）',
    firstReportedAt: hoursAgo(5),
    judgeTag: null,
    judgeNote: '',
    assignees: [],
    status: 'open',
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  },
  {
    id: 'INC-002',
    title: '股吧集中发帖：质疑公司中报业绩真实性',
    category: 'investor',
    urgency: 'high',
    summary: '东方财富股吧、雪球社区出现多篇分析帖，对比公司过往财报数据，质疑即将发布的中报存在业绩调节嫌疑，跟帖量已超2000条。',
    heat: 5460,
    heatTrend: 'rising',
    trendPoints: [
      { time: '09:30', value: 420 },
      { time: '10:00', value: 880 },
      { time: '10:30', value: 1560 },
      { time: '11:00', value: 2380 },
      { time: '11:30', value: 3120 },
      { time: '13:00', value: 4480 },
      { time: '13:30', value: 5460 }
    ],
    evidenceImages: [
      { id: 'E3', url: 'https://picsum.photos/id/6/600/400', caption: '东方财富股吧热帖' },
      { id: 'E4', url: 'https://picsum.photos/id/8/600/400', caption: '雪球讨论区截图' }
    ],
    keyComments: [
      { id: 'C3', author: '资深韭菜王', content: '对比去年同期，这笔应收账款变动太异常了，懂的都懂。', platform: '东方财富', time: hoursAgo(3.2), likes: 567 },
      { id: 'C4', author: '价值投资小白', content: '刚买了300手，这是要爆雷的节奏吗？', platform: '雪球', time: hoursAgo(2.1), likes: 342 }
    ],
    suspectedSource: '某IP属地广东的匿名用户在股吧首发（主贴已被删）',
    firstReportedAt: hoursAgo(6),
    judgeTag: 'exaggerate',
    judgeNote: '已初步核对财务数据，发帖人对会计准则理解有误',
    assignees: ['secretary'],
    status: 'assigned',
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  },
  {
    id: 'INC-003',
    title: '客户投诉被财经号转发：售后态度问题发酵',
    category: 'complaint',
    urgency: 'medium',
    summary: '一宗常规售后投诉被某消费者维权类财经号转发，附通话录音片段和聊天记录截图，多个本地生活号跟进转载。',
    heat: 2180,
    heatTrend: 'stable',
    trendPoints: [
      { time: '09:30', value: 120 },
      { time: '10:00', value: 280 },
      { time: '10:30', value: 560 },
      { time: '11:00', value: 980 },
      { time: '11:30', value: 1420 },
      { time: '13:00', value: 1890 },
      { time: '13:30', value: 2180 }
    ],
    evidenceImages: [
      { id: 'E5', url: 'https://picsum.photos/id/3/600/400', caption: '财经号原文截图' },
      { id: 'E6', url: 'https://picsum.photos/id/119/600/400', caption: '聊天记录截图' }
    ],
    keyComments: [
      { id: 'C5', author: '吃瓜群众A', content: '这态度也太嚣张了，以后不会再买了。', platform: '微信公众号', time: hoursAgo(4), likes: 128 },
      { id: 'C6', author: '行业内部人', content: '其实双方都有问题，但客服话术确实有问题。', platform: '知乎', time: hoursAgo(3), likes: 89 }
    ],
    suspectedSource: '客户本人在小红书首发吐槽（已删除）',
    firstReportedAt: hoursAgo(8),
    judgeTag: 'pending',
    judgeNote: '正在核实完整通话录音上下文',
    assignees: ['business', 'legal'],
    status: 'assigned',
    factStatement: '经核实：客户购买产品后因使用不当提出退货，客服沟通中确实存在用语不规范情况，但不存在"拒绝售后"。公司已与客户取得联系并达成和解。',
    publicStatement: '针对近期网传售后沟通事件，我司高度重视。经内部核查，该事件系沟通表达不当引发的误解，我们已第一时间与客户达成谅解。公司将对相关人员进行服务培训，持续提升客户体验。感谢社会各界监督。',
    noResponseBoundary: '1. 不公开客户个人信息；2. 不回应"内部管理混乱"等过度延伸指责；3. 不与任何自媒体打口水仗；4. 不披露具体和解金额。'
  },
  {
    id: 'INC-004',
    title: '旧闻重炒：去年行政处罚案被重新翻出',
    category: 'media',
    urgency: 'low',
    summary: '某自媒体将公司去年已处理完毕的行政处罚案重新发布，措辞暗示"近期被罚"，但传播量较小，未进入主流视野。',
    heat: 680,
    heatTrend: 'falling',
    trendPoints: [
      { time: '09:30', value: 80 },
      { time: '10:00', value: 180 },
      { time: '10:30', value: 320 },
      { time: '11:00', value: 480 },
      { time: '11:30', value: 620 },
      { time: '13:00', value: 680 },
      { time: '13:30', value: 650 }
    ],
    evidenceImages: [
      { id: 'E7', url: 'https://picsum.photos/id/160/600/400', caption: '自媒体旧文截图' }
    ],
    keyComments: [
      { id: 'C7', author: '路人甲', content: '这不是去年的事吗？', platform: '微信', time: hoursAgo(1.5), likes: 45 }
    ],
    suspectedSource: '某小V公众号为博流量旧闻新发',
    firstReportedAt: hoursAgo(4),
    judgeTag: 'oldnews',
    judgeNote: '已确认是2025年Q3处罚，公司当时已公告并完成整改',
    assignees: [],
    status: 'confirmed',
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  },
  {
    id: 'INC-005',
    title: '雪球热帖：行业政策变化对公司影响分析',
    category: 'investor',
    urgency: 'medium',
    summary: '雪球大V发布深度分析帖，讨论最新行业监管政策对公司业务的潜在影响，阅读量超5万，讨论较为理性。',
    heat: 1890,
    heatTrend: 'stable',
    trendPoints: [
      { time: '09:30', value: 200 },
      { time: '10:00', value: 450 },
      { time: '10:30', value: 780 },
      { time: '11:00', value: 1120 },
      { time: '11:30', value: 1450 },
      { time: '13:00', value: 1720 },
      { time: '13:30', value: 1890 }
    ],
    evidenceImages: [
      { id: 'E8', url: 'https://picsum.photos/id/201/600/400', caption: '雪球分析帖' }
    ],
    keyComments: [
      { id: 'C8', author: '机构研究员L', content: '逻辑基本成立，但短期影响有限，长期看政策利好合规龙头。', platform: '雪球', time: hoursAgo(2), likes: 234 }
    ],
    suspectedSource: '雪球认证个人投资者原创分析',
    firstReportedAt: hoursAgo(6),
    judgeTag: null,
    judgeNote: '',
    assignees: ['secretary'],
    status: 'open',
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  },
  {
    id: 'INC-006',
    title: '恶意谣传：微信群散布公司资金链断裂谣言',
    category: 'complaint',
    urgency: 'high',
    summary: '多个投资微信群出现"公司资金链断裂、银行抽贷"等不实信息，附伪造的"内部通知"截图，疑似有组织做空。',
    heat: 4320,
    heatTrend: 'rising',
    trendPoints: [
      { time: '09:30', value: 150 },
      { time: '10:00', value: 420 },
      { time: '10:30', value: 860 },
      { time: '11:00', value: 1680 },
      { time: '11:30', value: 2540 },
      { time: '13:00', value: 3680 },
      { time: '13:30', value: 4320 }
    ],
    evidenceImages: [
      { id: 'E9', url: 'https://picsum.photos/id/3/600/400', caption: '微信群谣言截图1' },
      { id: 'E10', url: 'https://picsum.photos/id/9/600/400', caption: '微信群谣言截图2' },
      { id: 'E11', url: 'https://picsum.photos/id/119/600/400', caption: '伪造内部通知' }
    ],
    keyComments: [
      { id: 'C9', author: '匿名', content: '据说下周要停牌，内部消息。', platform: '微信群', time: hoursAgo(1.2), likes: 0 },
      { id: 'C10', author: '匿名', content: '我朋友在XX银行，说已经开始风险排查了。', platform: '微信群', time: hoursAgo(0.8), likes: 0 }
    ],
    suspectedSource: '疑似IP在境外的多个账号有组织同步发布',
    firstReportedAt: hoursAgo(3),
    judgeTag: 'malicious',
    judgeNote: '经财务和法务初步核实，公司经营正常，现金流充裕，该信息为100%伪造。已启动公证留证程序。',
    assignees: ['legal', 'secretary', 'business'],
    status: 'assigned',
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  }
];

export const mockSyncTemplates: SyncTemplate[] = [
  {
    id: 'SYNC-001',
    incidentId: 'INC-003',
    incidentTitle: '客户投诉被财经号转发：售后态度问题发酵',
    generatedAt: hoursAgo(1),
    progress: '经核实，客户投诉内容部分属实（客服用语不规范），但不存在拒绝售后的情况。公司已与客户达成和解，客户同意删除原帖。法务部已完成对外口径审定，业务部门对客服团队启动专项培训。',
    suggestedActions: [
      '14:00前 在官方微博发布正式声明',
      '联系首发财经号提供事实说明，请求更正',
      '客服部本周内完成话术规范复盘'
    ],
    nextCheckTime: new Date(now + 2 * 3600 * 1000).toISOString(),
    content: ''
  },
  {
    id: 'SYNC-002',
    incidentId: 'INC-006',
    incidentTitle: '恶意谣传：微信群散布公司资金链断裂谣言',
    generatedAt: hoursAgo(0.5),
    progress: '已确认系恶意谣言，公司财务数据一切正常。法务部已完成公证处电子证据存证，正在排查源头IP。董秘办草拟公告，预计15:00前通过交易所渠道发布。',
    suggestedActions: [
      '15:00前 发布交易所临时停牌澄清公告（如需）',
      '联合主流财经媒体发布权威报道',
      '联系各大平台举报删除不实信息',
      '持续监控融券异动数据'
    ],
    nextCheckTime: new Date(now + 1 * 3600 * 1000).toISOString(),
    content: ''
  }
];
