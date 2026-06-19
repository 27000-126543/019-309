export type IncidentCategory = 'media' | 'investor' | 'complaint';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type JudgeTag = 'pending' | 'exaggerate' | 'oldnews' | 'malicious';

export type AssigneeDept = 'legal' | 'business' | 'secretary';

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
  assignees: AssigneeDept[];
  status: 'open' | 'assigned' | 'confirmed' | 'closed';
  factStatement: string;
  publicStatement: string;
  noResponseBoundary: string;
}

export interface SyncTemplate {
  id: string;
  incidentId: string;
  incidentTitle: string;
  generatedAt: string;
  progress: string;
  suggestedActions: string[];
  nextCheckTime: string;
  content: string;
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
