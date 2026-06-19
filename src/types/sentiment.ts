export type IncidentCategory = 'media' | 'investor' | 'complaint';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type JudgeTag = 'pending' | 'exaggerate' | 'oldnews' | 'malicious';

export type AssigneeDept = 'legal' | 'business' | 'secretary';

export type DeptFeedbackStatus = 'pending' | 'in_progress' | 'submitted' | 'rejected';

export type TimelineEventType =
  | 'first_report'
  | 'judge'
  | 'assign'
  | 'dept_feedback'
  | 'dept_reject'
  | 'generate_sync'
  | 'status_change'
  | 'note';

export interface TrendPoint {
  time: string;
  value: number;
}

export interface EvidenceImage {
  id: string;
  url: string;
  caption: string;
}

export interface KeyComment {
  id: string;
  author: string;
  content: string;
  platform: string;
  time: string;
  likes: number;
}

export interface DeptFeedback {
  dept: AssigneeDept;
  status: DeptFeedbackStatus;
  assignedAt: string;
  respondedAt: string | null;
  factStatement: string;
  publicStatement: string;
  noResponseBoundary: string;
  assigneeName: string;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectReason: string;
  resubmitCount: number;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  time: string;
  actor: string;
  title: string;
  description: string;
  dept?: AssigneeDept;
}

export interface Incident {
  id: string;
  title: string;
  category: IncidentCategory;
  urgency: UrgencyLevel;
  summary: string;
  heat: number;
  heatTrend: 'rising' | 'stable' | 'falling';
  trendPoints: TrendPoint[];
  evidenceImages: EvidenceImage[];
  keyComments: KeyComment[];
  suspectedSource: string;
  firstReportedAt: string;
  judgeTag: JudgeTag | null;
  judgeNote: string;
  judgedAt: string | null;
  judgedBy: string | null;
  status: 'open' | 'assigned' | 'confirmed' | 'closed';
  feedbacks: Record<AssigneeDept, DeptFeedback | null>;
  timeline: TimelineEvent[];
  updatedAt: string;
}

export interface SyncTemplate {
  id: string;
  incidentId: string;
  incidentTitle: string;
  incidentCategory: IncidentCategory;
  generatedAt: string;
  progress: string;
  suggestedActions: string[];
  nextCheckTime: string;
  content: string;
  generatedBy: string;
  snapshotHeat: number;
  snapshotJudgeTag: JudgeTag | null;
  snapshotJudgeNote: string;
  snapshotDeptStatus: Record<AssigneeDept, DeptFeedbackStatus | null>;
  snapshotFactStatement: string;
  snapshotPublicStatement: string;
  snapshotNoResponseBoundary: string;
  adaptiveCheckMinutes: number;
}

export interface CategoryTemplateConfig {
  suggestedActions: string[];
  defaultNextCheckMinutes: number;
  progressTemplate: string;
}

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  media: '媒体报道',
  investor: '投资者社区',
  complaint: '客户投诉外溢'
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critical: '特急',
  high: '紧急',
  medium: '关注',
  low: '观察'
};

export const JUDGE_LABELS: Record<JudgeTag, string> = {
  pending: '真实待确认',
  exaggerate: '夸大解读',
  oldnews: '旧闻重炒',
  malicious: '恶意谣传'
};

export const DEPT_LABELS: Record<AssigneeDept, string> = {
  legal: '法务部',
  business: '业务部门',
  secretary: '董秘办'
};

export const DEPT_FEEDBACK_STATUS_LABELS: Record<DeptFeedbackStatus, string> = {
  pending: '待反馈',
  in_progress: '处理中',
  submitted: '已反馈',
  rejected: '需补充'
};

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  first_report: '首次发现',
  judge: '初判打标',
  assign: '派单协同',
  dept_feedback: '部门反馈',
  dept_reject: '退回补充',
  generate_sync: '生成同步',
  status_change: '状态变更',
  note: '补充记录'
};

export const CATEGORY_TEMPLATES: Record<IncidentCategory, CategoryTemplateConfig> = {
  media: {
    suggestedActions: [
      '联系首发媒体，提供事实说明并请求更正/撤稿',
      '监测百度/微博热搜榜单变化，每30分钟记录一次',
      '准备官方声明（法务审定版），必要时通过官微发布',
      '同步 IR 团队，评估是否需要交易所公告渠道'
    ],
    defaultNextCheckMinutes: 60,
    progressTemplate:
      '媒体报道事项：已锁定首发源为【】，目前【X】家媒体转发。法务部正在【】，业务部门核实【】。当前舆情传播趋势【升温/平稳/降温】。'
  },
  investor: {
    suggestedActions: [
      '监测东方财富股吧、雪球、同花顺社区核心帖子跟帖量',
      '董秘办准备投资者问答口径（QA），同步客服团队',
      '评估是否需要通过互动易/上证E互动官方回应',
      '关注融券异动和龙虎榜数据，排查是否有做空配合'
    ],
    defaultNextCheckMinutes: 120,
    progressTemplate:
      '投资者社区事项：首发平台【】，主帖阅读量【】，跟帖【】条。核心质疑点为【】。董秘办已准备口径【】，财务数据比对结果【】。'
  },
  complaint: {
    suggestedActions: [
      '第一时间联系投诉当事人，了解诉求并争取和解',
      '核查内部客服录音/聊天记录，确认是否存在服务瑕疵',
      '监测各平台维权号、本地生活号转发情况',
      '业务部门复盘服务流程，形成内部整改建议'
    ],
    defaultNextCheckMinutes: 180,
    progressTemplate:
      '客户投诉事项：当事人【】，核心诉求【】。已/未取得联系，和解进展【】。转发媒体数量【】家，外部舆论趋势【】。'
  }
};

export interface AdaptiveRhythm {
  checkMinutes: number;
  label: string;
  extraActions: string[];
}

export function getAdaptiveRhythm(
  category: IncidentCategory,
  urgency: UrgencyLevel,
  heat: number
): AdaptiveRhythm {
  const isHighHeat = heat >= 5000;
  const isMidHeat = heat >= 2000;
  if (category === 'media') {
    if (urgency === 'critical' || isHighHeat) {
      return {
        checkMinutes: 30,
        label: '特急/高热度：每30分钟观察',
        extraActions: ['每30分钟更新热搜排名和转发量', '准备交易所公告口径，法务加急审定']
      };
    }
    if (urgency === 'high' || isMidHeat) {
      return {
        checkMinutes: 60,
        label: '紧急/中热度：每60分钟观察',
        extraActions: ['每小时记录一次百度/微博热搜变化']
      };
    }
    return {
      checkMinutes: 120,
      label: '常规：每2小时观察',
      extraActions: ['每2小时更新一次传播数据']
    };
  }
  if (category === 'investor') {
    if (urgency === 'critical' || isHighHeat) {
      return {
        checkMinutes: 60,
        label: '特急/高热度：每60分钟观察',
        extraActions: ['实时监控融券异动', '每60分钟更新互动易口径']
      };
    }
    if (urgency === 'high' || isMidHeat) {
      return {
        checkMinutes: 120,
        label: '紧急/中热度：每2小时观察',
        extraActions: ['每2小时统计股吧/雪球跟帖量变化']
      };
    }
    return {
      checkMinutes: 240,
      label: '常规：每4小时观察',
      extraActions: ['每日收盘后汇总一次']
    };
  }
  if (urgency === 'critical' || isHighHeat) {
    return {
      checkMinutes: 90,
      label: '特急/高热度：每90分钟观察',
      extraActions: ['每90分钟更新投诉人沟通进展', '监测维权号转发节奏']
    };
  }
  if (urgency === 'high' || isMidHeat) {
    return {
      checkMinutes: 180,
      label: '紧急/中热度：每3小时观察',
      extraActions: ['每3小时检查一次外部舆论走势']
    };
  }
  return {
    checkMinutes: 360,
    label: '常规：每6小时观察',
    extraActions: ['每日上午和下午各汇总一次']
  };
}
