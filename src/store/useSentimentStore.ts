import { create } from 'zustand';
import {
  Incident,
  SyncTemplate,
  JudgeTag,
  AssigneeDept,
  DeptFeedback,
  DeptFeedbackStatus,
  TimelineEvent,
  TimelineEventType,
  DEPT_LABELS,
  JUDGE_LABELS,
  IncidentCategory,
  UrgencyLevel,
  getAdaptiveRhythm,
  CATEGORY_TEMPLATES
} from '@/types/sentiment';

const CURRENT_USER = '张经理';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function createTimelineEvent(
  type: TimelineEventType,
  actor: string,
  title: string,
  description: string,
  dept?: AssigneeDept
): TimelineEvent {
  return {
    id: uid('EVT'),
    type,
    time: new Date().toISOString(),
    actor,
    title,
    description,
    dept
  };
}

interface SentimentStore {
  incidents: Incident[];
  syncTemplates: SyncTemplate[];
  currentUser: string;
  currentIncidentId: string;

  getIncident: (id: string) => Incident | undefined;
  setCurrentIncidentId: (id: string) => void;
  addTimelineEvent: (incidentId: string, event: Omit<TimelineEvent, 'id' | 'time'>) => void;

  setJudge: (incidentId: string, tag: JudgeTag | null, note: string) => void;

  assignDept: (incidentId: string, depts: AssigneeDept[]) => void;
  updateDeptFeedback: (
    incidentId: string,
    dept: AssigneeDept,
    patch: Partial<DeptFeedback>
  ) => void;
  submitDeptFeedback: (
    incidentId: string,
    dept: AssigneeDept,
    feedback: {
      factStatement: string;
      publicStatement: string;
      noResponseBoundary: string;
    }
  ) => void;
  rejectDeptFeedback: (incidentId: string, dept: AssigneeDept, reason: string) => void;

  getLatestValidFeedback: (incident: Incident, dept: AssigneeDept) => DeptFeedback | null;
  getMergedFeedback: (incident: Incident) => {
    factStatement: string;
    publicStatement: string;
    noResponseBoundary: string;
  };

  getDeptStatusSnapshot: (incident: Incident) => Record<AssigneeDept, DeptFeedbackStatus | null>;

  buildSyncSnapshot: (incident: Incident) => {
    snapshotHeat: number;
    snapshotJudgeTag: JudgeTag | null;
    snapshotJudgeNote: string;
    snapshotDeptStatus: Record<AssigneeDept, DeptFeedbackStatus | null>;
    snapshotFactStatement: string;
    snapshotPublicStatement: string;
    snapshotNoResponseBoundary: string;
    adaptiveCheckMinutes: number;
  };

  addSyncTemplate: (tpl: Omit<SyncTemplate, 'id' | 'generatedAt' | 'generatedBy' | 'version' | 'previousId' | 'versionNote'> & { versionNote?: string }) => void;

  getIncidentNextCheckTime: (incident: Incident) => string | null;
  getSortedByUrgency: () => Incident[];

  updateIncident: (id: string, patch: Partial<Incident>) => void;
}

const EMPTY_DEPT_STATUS: Record<AssigneeDept, DeptFeedbackStatus | null> = {
  legal: null,
  business: null,
  secretary: null
};

export const useSentimentStore = create<SentimentStore>((set, get) => ({
  incidents: [],
  syncTemplates: [],
  currentUser: CURRENT_USER,
  currentIncidentId: '',

  getIncident: (id) => get().incidents.find((i) => i.id === id),

  setCurrentIncidentId: (id) => {
    set({ currentIncidentId: id });
    console.log('[Store] setCurrentIncidentId:', id);
  },

  addTimelineEvent: (incidentId, event) => {
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              timeline: [...i.timeline, createTimelineEvent(event.type, event.actor, event.title, event.description, event.dept)],
              updatedAt: new Date().toISOString()
            }
          : i
      )
    }));
  },

  setJudge: (incidentId, tag, note) => {
    const now = new Date().toISOString();
    set((s) => ({
      currentIncidentId: incidentId,
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const title = tag
          ? `初判：${JUDGE_LABELS[tag]}`
          : '取消初判标签';
        const desc = note ? `说明：${note}` : '未填写说明';
        return {
          ...i,
          judgeTag: tag,
          judgeNote: note,
          judgedAt: now,
          judgedBy: s.currentUser,
          status: i.status === 'open' ? 'assigned' : i.status,
          timeline: [
            ...i.timeline,
            createTimelineEvent('judge', s.currentUser, title, desc)
          ],
          updatedAt: now
        };
      })
    }));
    console.log('[Store] setJudge:', { incidentId, tag, note });
  },

  assignDept: (incidentId, depts) => {
    const now = new Date().toISOString();
    set((s) => ({
      currentIncidentId: incidentId,
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;

        const newFeedbacks = { ...i.feedbacks };
        const assignedNames: Record<AssigneeDept, string> = {
          legal: '李法务',
          business: '王业务',
          secretary: '赵董秘'
        };
        const newEvents: TimelineEvent[] = [];

        depts.forEach((dept) => {
          if (!newFeedbacks[dept]) {
            newFeedbacks[dept] = {
              dept,
              status: 'pending',
              assignedAt: now,
              respondedAt: null,
              factStatement: '',
              publicStatement: '',
              noResponseBoundary: '',
              assigneeName: assignedNames[dept],
              rejectedAt: null,
              rejectedBy: null,
              rejectReason: '',
              resubmitCount: 0,
              previousContent: null
            };
            newEvents.push(
              createTimelineEvent(
                'assign',
                s.currentUser,
                `派单给${DEPT_LABELS[dept]}`,
                `负责人：${assignedNames[dept]}`,
                dept
              )
            );
          }
        });

        return {
          ...i,
          feedbacks: newFeedbacks,
          status: 'assigned',
          timeline: [...i.timeline, ...newEvents],
          updatedAt: now
        };
      })
    }));
    console.log('[Store] assignDept:', { incidentId, depts });
  },

  updateDeptFeedback: (incidentId, dept, patch) => {
    set((s) => ({
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const fb = i.feedbacks[dept];
        if (!fb) return i;
        const newFb = { ...fb, ...patch };
        if (patch.factStatement || patch.publicStatement || patch.noResponseBoundary) {
          newFb.status = 'in_progress';
        }
        return {
          ...i,
          feedbacks: { ...i.feedbacks, [dept]: newFb },
          updatedAt: new Date().toISOString()
        };
      })
    }));
  },

  submitDeptFeedback: (incidentId, dept, feedback) => {
    const now = new Date().toISOString();
    set((s) => ({
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const fb = i.feedbacks[dept];
        if (!fb) return i;
        const isResubmit = fb.status === 'rejected';
        return {
          ...i,
          feedbacks: {
            ...i.feedbacks,
            [dept]: {
              ...fb,
              ...feedback,
              status: 'submitted',
              respondedAt: now,
              resubmitCount: isResubmit ? fb.resubmitCount : fb.resubmitCount
            }
          },
          timeline: [
            ...i.timeline,
            createTimelineEvent(
              'dept_feedback',
              fb.assigneeName,
              isResubmit
                ? `${DEPT_LABELS[dept]}再次反馈（第${fb.resubmitCount}次补充）`
                : `${DEPT_LABELS[dept]}已反馈`,
              isResubmit
                ? `补充后事实说明 ${feedback.factStatement.length} 字，口径已更新`
                : `事实说明已填写 ${feedback.factStatement.length} 字，口径已审定`,
              dept
            )
          ],
          updatedAt: now
        };
      })
    }));
    console.log('[Store] submitDeptFeedback:', { incidentId, dept });
  },

  rejectDeptFeedback: (incidentId, dept, reason) => {
    const now = new Date().toISOString();
    set((s) => ({
      incidents: s.incidents.map((i) => {
        if (i.id !== incidentId) return i;
        const fb = i.feedbacks[dept];
        if (!fb || fb.status !== 'submitted') return i;
        return {
          ...i,
          feedbacks: {
            ...i.feedbacks,
            [dept]: {
              ...fb,
              status: 'rejected' as DeptFeedbackStatus,
              rejectedAt: now,
              rejectedBy: s.currentUser,
              rejectReason: reason,
              resubmitCount: fb.resubmitCount + 1,
              previousContent: {
                factStatement: fb.factStatement,
                publicStatement: fb.publicStatement,
                noResponseBoundary: fb.noResponseBoundary
              }
            }
          },
          timeline: [
            ...i.timeline,
            createTimelineEvent(
              'dept_reject',
              s.currentUser,
              `退回${DEPT_LABELS[dept]}反馈`,
              `原因：${reason || '需补充信息'}`,
              dept
            )
          ],
          updatedAt: now
        };
      })
    }));
    console.log('[Store] rejectDeptFeedback:', { incidentId, dept, reason });
  },

  getLatestValidFeedback: (incident, dept) => {
    const fb = incident.feedbacks[dept];
    return fb && fb.status === 'submitted' ? fb : null;
  },

  getMergedFeedback: (incident) => {
    const fbs = (Object.keys(incident.feedbacks) as AssigneeDept[])
      .map((d) => incident.feedbacks[d])
      .filter((fb): fb is DeptFeedback => !!fb && fb.status === 'submitted');
    const merge = (key: 'factStatement' | 'publicStatement' | 'noResponseBoundary') =>
      fbs
        .filter((f) => f[key]?.trim())
        .map((f) => `【${DEPT_LABELS[f.dept]}】${f[key]}`)
        .join('\n\n');
    return {
      factStatement: merge('factStatement'),
      publicStatement: merge('publicStatement'),
      noResponseBoundary: merge('noResponseBoundary')
    };
  },

  getDeptStatusSnapshot: (incident) => {
    const result = { ...EMPTY_DEPT_STATUS };
    (Object.keys(incident.feedbacks) as AssigneeDept[]).forEach((d) => {
      result[d] = incident.feedbacks[d]?.status || null;
    });
    return result;
  },

  buildSyncSnapshot: (incident) => {
    const merged = get().getMergedFeedback(incident);
    const category: IncidentCategory = incident.category;
    const urgency: UrgencyLevel = incident.urgency;
    const rhythm = getAdaptiveRhythm(category, urgency, incident.heat);
    return {
      snapshotHeat: incident.heat,
      snapshotJudgeTag: incident.judgeTag,
      snapshotJudgeNote: incident.judgeNote,
      snapshotDeptStatus: get().getDeptStatusSnapshot(incident),
      snapshotFactStatement: merged.factStatement,
      snapshotPublicStatement: merged.publicStatement,
      snapshotNoResponseBoundary: merged.noResponseBoundary,
      adaptiveCheckMinutes: rhythm.checkMinutes
    };
  },

  getIncidentNextCheckTime: (incident) => {
    const { syncTemplates } = get();
    const myTemplates = syncTemplates.filter((t) => t.incidentId === incident.id);
    if (myTemplates.length === 0) return null;
    return myTemplates[0].nextCheckTime;
  },

  getSortedByUrgency: () => {
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...get().incidents].sort((a, b) => {
      const ua = urgencyOrder[a.urgency];
      const ub = urgencyOrder[b.urgency];
      if (ua !== ub) return ua - ub;
      return b.heat - a.heat;
    });
  },

  addSyncTemplate: (tpl) => {
    const now = new Date().toISOString();
    const { syncTemplates } = get();
    const myTemplates = syncTemplates
      .filter((t) => t.incidentId === tpl.incidentId)
      .sort((a, b) => b.version - a.version);
    const lastVersion = myTemplates[0];
    const version = lastVersion ? lastVersion.version + 1 : 1;
    const previousId = lastVersion ? lastVersion.id : null;

    const newTpl: SyncTemplate = {
      version,
      previousId,
      versionNote: tpl.versionNote || '',
      ...tpl,
      id: uid('SYNC'),
      generatedAt: now,
      generatedBy: CURRENT_USER
    };
    set((s) => ({
      syncTemplates: [newTpl, ...s.syncTemplates],
      incidents: s.incidents.map((i) =>
        i.id === tpl.incidentId
          ? {
              ...i,
              timeline: [
                ...i.timeline,
                createTimelineEvent(
                  'generate_sync',
                  CURRENT_USER,
                  `生成同步模板（v${version}）`,
                  `共 ${tpl.suggestedActions.length} 项建议动作，下次观察：${tpl.nextCheckTime}`
                )
              ],
              updatedAt: now
            }
          : i
      )
    }));
    console.log('[Store] addSyncTemplate:', newTpl.id, 'v' + version);
  },

  updateIncident: (id, patch) => {
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i
      )
    }));
  }
}));

export function hydrateStore(incidents: Incident[], templates: SyncTemplate[]) {
  const firstId = incidents[0]?.id || '';
  useSentimentStore.setState({
    incidents,
    syncTemplates: templates,
    currentIncidentId: firstId
  });
}
