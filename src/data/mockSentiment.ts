import { Incident, SyncTemplate, DeptFeedback, TimelineEvent } from '@/types/sentiment';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

function ev(
  id: string,
  type: TimelineEvent['type'],
  time: string,
  actor: string,
  title: string,
  description: string,
  dept?: TimelineEvent['dept']
): TimelineEvent {
  return { id, type, time, actor, title, description, dept };
}

function emptyFeedbacks(): Record<string, DeptFeedback | null> {
  return { legal: null, business: null, secretary: null };
}

function makeFeedback(
  dept: DeptFeedback['dept'],
  status: DeptFeedback['status'],
  assignedMin: number,
  respondedMin: number | null,
  overrides: Partial<DeptFeedback> = {}
): DeptFeedback {
  const names: Record<string, string> = { legal: '李法务', business: '王业务', secretary: '赵董秘' };
  return {
    dept,
    status,
    assignedAt: minutesAgo(assignedMin),
    respondedAt: respondedMin ? minutesAgo(respondedMin) : null,
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: '',
    assigneeName: names[dept],
    rejectedAt: null,
    rejectedBy: null,
    rejectReason: '',
    resubmitCount: 0,
    previousContent: null,
    ...overrides
  };
}

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
    judgedAt: null,
    judgedBy: null,
    status: 'open',
    feedbacks: emptyFeedbacks(),
    timeline: [
      ev('EVT-001-1', 'first_report', hoursAgo(5), '系统自动监测', '首次监测到相关舆情', '监测源：微博、今日头条，初始热度320')
    ],
    updatedAt: minutesAgo(10)
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
    judgeNote: '已初步核对财务数据，发帖人对会计准则理解有误，应收账款变动系季节性正常波动',
    judgedAt: hoursAgo(2.5),
    judgedBy: '张经理',
    status: 'assigned',
    feedbacks: {
      ...emptyFeedbacks(),
      secretary: makeFeedback('secretary', 'in_progress', 150, null, {
        factStatement: '董秘办已调取近三年同期财报对比，应收账款变动幅度与往年Q2基本一致，主要系经销商备货节奏变化所致。目前已准备详细数据说明。',
        publicStatement: '',
        noResponseBoundary: ''
      })
    },
    timeline: [
      ev('EVT-002-1', 'first_report', hoursAgo(6), '系统自动监测', '首次监测到股吧热帖', '监测源：东方财富股吧，主帖阅读量1.2万'),
      ev('EVT-002-2', 'judge', hoursAgo(2.5), '张经理', '初判：夸大解读', '已核对财务数据，发帖人对会计准则理解有误'),
      ev('EVT-002-3', 'assign', hoursAgo(2.5), '张经理', '派单给董秘办', '负责人：赵董秘', 'secretary')
    ],
    updatedAt: minutesAgo(15)
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
    judgedAt: hoursAgo(4),
    judgedBy: '张经理',
    status: 'assigned',
    feedbacks: {
      ...emptyFeedbacks(),
      business: makeFeedback('business', 'submitted', 240, 90, {
        factStatement: '业务部已调取完整通话录音及客服工单：客户于6月15日购买XX型号产品，6月17日提出"7天无理由退货"，因包装已拆封影响二次销售，客服沟通时表示需检测后处理，但用词确实不规范（"你自己看着办"等）。不存在拒绝售后，已与客户电话沟通并达成全额退款+200元购物券和解，客户同意删除原帖。',
        publicStatement: '',
        noResponseBoundary: ''
      }),
      legal: makeFeedback('legal', 'submitted', 220, 80, {
        factStatement: '法务审核结论：1、公司7天无理由退货政策符合消法规定；2、客服不当言论不构成法律责任，但建议整改话术；3、如对外声明需谨慎措辞，避免承认"产品质量问题"。',
        publicStatement: '针对近期网传售后沟通事件，我司高度重视。经内部核查，该事件系沟通表达不当引发的误解，我们已第一时间与客户达成谅解。公司将对相关人员进行服务培训，持续提升客户体验。感谢社会各界监督。',
        noResponseBoundary: '1. 不公开客户个人信息及联系方式；2. 不回应"内部管理混乱""店大欺客"等过度延伸指责；3. 不与任何自媒体或当事人打口水仗；4. 不披露具体和解金额及购物券金额；5. 不主动提及其他历史投诉案例。'
      })
    },
    timeline: [
      ev('EVT-003-1', 'first_report', hoursAgo(8), '系统自动监测', '首次监测到客户投诉', '监测源：小红书，用户首发'),
      ev('EVT-003-2', 'judge', hoursAgo(4), '张经理', '初判：真实待确认', '正在核实完整通话录音上下文'),
      ev('EVT-003-3', 'assign', hoursAgo(4), '张经理', '派单给业务部门', '负责人：王业务', 'business'),
      ev('EVT-003-4', 'assign', hoursAgo(3.5), '张经理', '派单给法务部', '负责人：李法务', 'legal'),
      ev('EVT-003-5', 'dept_feedback', hoursAgo(1.5), '王业务', '业务部门已反馈', '已与客户达成和解，客户同意删帖', 'business'),
      ev('EVT-003-6', 'dept_feedback', minutesAgo(80), '李法务', '法务部已反馈', '对外口径已审定，回应边界已明确', 'legal')
    ],
    updatedAt: minutesAgo(60)
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
    evidenceImages: [{ id: 'E7', url: 'https://picsum.photos/id/160/600/400', caption: '自媒体旧文截图' }],
    keyComments: [{ id: 'C7', author: '路人甲', content: '这不是去年的事吗？', platform: '微信', time: hoursAgo(1.5), likes: 45 }],
    suspectedSource: '某小V公众号为博流量旧闻新发',
    firstReportedAt: hoursAgo(4),
    judgeTag: 'oldnews',
    judgeNote: '已确认是2025年Q3处罚，公司当时已公告并完成整改，信息披露合规',
    judgedAt: hoursAgo(2),
    judgedBy: '张经理',
    status: 'confirmed',
    feedbacks: emptyFeedbacks(),
    timeline: [
      ev('EVT-004-1', 'first_report', hoursAgo(4), '系统自动监测', '首次监测到自媒体旧文', '监测源：微信公众号'),
      ev('EVT-004-2', 'judge', hoursAgo(2), '张经理', '初判：旧闻重炒', '已确认是2025年Q3处罚，当时已公告并整改'),
      ev('EVT-004-3', 'status_change', hoursAgo(2), '张经理', '状态变更：已核实', '无需派单协同，持续观察即可')
    ],
    updatedAt: minutesAgo(120)
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
    evidenceImages: [{ id: 'E8', url: 'https://picsum.photos/id/201/600/400', caption: '雪球分析帖' }],
    keyComments: [{ id: 'C8', author: '机构研究员L', content: '逻辑基本成立，但短期影响有限，长期看政策利好合规龙头。', platform: '雪球', time: hoursAgo(2), likes: 234 }],
    suspectedSource: '雪球认证个人投资者原创分析',
    firstReportedAt: hoursAgo(6),
    judgeTag: null,
    judgeNote: '',
    judgedAt: null,
    judgedBy: null,
    status: 'open',
    feedbacks: {
      ...emptyFeedbacks(),
      secretary: makeFeedback('secretary', 'pending', 30, null)
    },
    timeline: [
      ev('EVT-005-1', 'first_report', hoursAgo(6), '系统自动监测', '首次监测到雪球深度帖', '阅读量超5万，讨论理性'),
      ev('EVT-005-2', 'assign', minutesAgo(30), '张经理', '派单给董秘办', '评估是否需要正式回应', 'secretary')
    ],
    updatedAt: minutesAgo(25)
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
    judgeNote: '经财务和法务初步核实，公司经营正常，现金流充裕，该信息为100%伪造。已启动公证处电子证据存证程序，同步联系平台方。',
    judgedAt: hoursAgo(1.5),
    judgedBy: '张经理',
    status: 'assigned',
    feedbacks: {
      ...emptyFeedbacks(),
      legal: makeFeedback('legal', 'in_progress', 90, null, {
        factStatement: '法务部已完成：1、上海某公证处电子证据存证（存证编号SH-GZ-2026-XXXXXX）；2、联系微信安全中心举报12个核心传播群；3、律师函草拟中，预计1小时后定稿。正在排查源头IP地址。',
        publicStatement: '',
        noResponseBoundary: ''
      }),
      secretary: makeFeedback('secretary', 'in_progress', 90, null, {
        factStatement: '董秘办已：1、对接交易所报备该事项；2、草拟《关于不实信息的澄清公告》，待法务审定后走公告流程；3、同步机构投资者关系团队，准备定向沟通口径。',
        publicStatement: '',
        noResponseBoundary: ''
      }),
      business: makeFeedback('business', 'submitted', 90, 50, {
        factStatement: '业务部核实：公司目前在手订单充足（Q2已完成全年目标65%），与前5大客户合作稳定，主要供应商账期未变。一线销售未出现异常退换货。经营一切正常。',
        publicStatement: '',
        noResponseBoundary: ''
      })
    },
    timeline: [
      ev('EVT-006-1', 'first_report', hoursAgo(3), '系统自动监测', '首次监测到微信群谣言', '监测源：12个投资微信群同步传播'),
      ev('EVT-006-2', 'judge', hoursAgo(1.5), '张经理', '初判：恶意谣传', '100%伪造，已启动公证留证'),
      ev('EVT-006-3', 'assign', hoursAgo(1.5), '张经理', '派单给法务部', '负责人：李法务', 'legal'),
      ev('EVT-006-4', 'assign', hoursAgo(1.5), '张经理', '派单给董秘办', '负责人：赵董秘', 'secretary'),
      ev('EVT-006-5', 'assign', hoursAgo(1.5), '张经理', '派单给业务部门', '负责人：王业务', 'business'),
      ev('EVT-006-6', 'dept_feedback', minutesAgo(50), '王业务', '业务部门已反馈', '一线经营一切正常，订单充足', 'business')
    ],
    updatedAt: minutesAgo(35)
  }
];

export const mockSyncTemplates: SyncTemplate[] = [
  {
    id: 'SYNC-001',
    incidentId: 'INC-003',
    incidentTitle: '客户投诉被财经号转发：售后态度问题发酵',
    incidentCategory: 'complaint',
    generatedAt: hoursAgo(1),
    progress:
      '客户投诉事项：当事人XX，核心诉求退货+赔偿。已取得电话联系并达成和解（全额退款+200元购物券），客户同意删除原帖。转发媒体数量共7家，目前热度趋稳。法务已审定对外口径，业务部对客服团队启动专项话术培训。',
    suggestedActions: [
      '14:00前 在官方微博发布正式声明（法务已审定版）',
      '联系首发财经号提供事实说明，请求更正或撤稿',
      '客服部本周内完成话术规范复盘及全员培训',
      '持续监测舆情至今日收盘，如无升温可关闭'
    ],
    nextCheckTime: '6月19日 15:30（收盘复盘）',
    content: '',
    generatedBy: '张经理',
    snapshotHeat: 2180,
    snapshotJudgeTag: 'pending',
    snapshotJudgeNote: '正在核实完整通话录音上下文',
    snapshotDeptStatus: { legal: 'submitted', business: 'submitted', secretary: null },
    snapshotFactStatement: '【法务部】法务审核结论：1、公司7天无理由退货政策符合消法规定；2、客服不当言论不构成法律责任，但建议整改话术；3、如对外声明需谨慎措辞，避免承认"产品质量问题"。\n\n【业务部门】业务部已调取完整通话录音及客服工单：客户于6月15日购买XX型号产品，6月17日提出"7天无理由退货"，因包装已拆封影响二次销售，客服沟通时表示需检测后处理，但用词确实不规范（"你自己看着办"等）。不存在拒绝售后，已与客户电话沟通并达成全额退款+200元购物券和解，客户同意删除原帖。',
    snapshotPublicStatement: '【法务部】针对近期网传售后沟通事件，我司高度重视。经内部核查，该事件系沟通表达不当引发的误解，我们已第一时间与客户达成谅解。公司将对相关人员进行服务培训，持续提升客户体验。感谢社会各界监督。',
    snapshotNoResponseBoundary: '【法务部】1. 不公开客户个人信息及联系方式；2. 不回应"内部管理混乱""店大欺客"等过度延伸指责；3. 不与任何自媒体或当事人打口水仗；4. 不披露具体和解金额及购物券金额；5. 不主动提及其他历史投诉案例。',
    adaptiveCheckMinutes: 180,
    version: 1,
    previousId: null,
    versionNote: '首次同步：投诉事项基本处理完毕，对外口径已审定'
  },
  {
    id: 'SYNC-002',
    incidentId: 'INC-006',
    incidentTitle: '恶意谣传：微信群散布公司资金链断裂谣言',
    incidentCategory: 'complaint',
    generatedAt: minutesAgo(30),
    progress:
      '客户投诉（恶意谣传类）：微信群"资金链断裂"谣言，已确认为100%伪造。法务完成公证处电子存证，正在排查源头IP；董秘办已对接交易所，公告草拟中；业务核实一线经营一切正常。',
    suggestedActions: [
      '15:00前 发布交易所澄清公告（法务最终审定中）',
      '联合主流财经媒体发布权威报道，压制谣言传播',
      '联系各大平台方批量举报删除不实信息',
      'IR团队定向沟通前50大机构投资者',
      '持续监控融券异动及龙虎榜数据'
    ],
    nextCheckTime: '6月19日 14:30（公告发布后复盘）',
    content: '',
    generatedBy: '张经理',
    snapshotHeat: 4320,
    snapshotJudgeTag: 'malicious',
    snapshotJudgeNote: '经财务和法务初步核实，公司经营正常，现金流充裕，该信息为100%伪造。已启动公证处电子证据存证程序，同步联系平台方。',
    snapshotDeptStatus: { legal: 'in_progress', business: 'submitted', secretary: 'in_progress' },
    snapshotFactStatement: '【法务部】法务部已完成：1、上海某公证处电子证据存证（存证编号SH-GZ-2026-XXXXXX）；2、联系微信安全中心举报12个核心传播群；3、律师函草拟中，预计1小时后定稿。正在排查源头IP地址。\n\n【业务部门】业务部核实：公司目前在手订单充足（Q2已完成全年目标65%），与前5大客户合作稳定，主要供应商账期未变。一线销售未出现异常退换货。经营一切正常。\n\n【董秘办】董秘办已：1、对接交易所报备该事项；2、草拟《关于不实信息的澄清公告》，待法务审定后走公告流程；3、同步机构投资者关系团队，准备定向沟通口径。',
    snapshotPublicStatement: '',
    snapshotNoResponseBoundary: '',
    adaptiveCheckMinutes: 90,
    version: 1,
    previousId: null,
    versionNote: '首次同步：谣言已确认为伪造，处置方案初步确定'
  }
];
