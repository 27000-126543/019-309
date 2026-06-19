import { create } from 'zustand';
import {
  Incident,
  SyncTemplate,
  JudgeTag,
  AssigneeDept,
  DeptFeedback,
  TimelineEvent,
  TimelineEventType,
  DEPT_LABELS,
  JUDGE_LABELS,
  IncidentCategory
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

  getIncident: (id: string) => Incident | undefined;
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

  getMergedFeedback: (incident: Incident) => {
    factStatement: string;
    publicStatement: string;
    noResponseBoundary: string;
  };

  addSyncTemplate: (tpl: Omit<SyncTemplate, 'id' | 'generatedAt' | 'generatedBy'>) => void;

  updateIncident: (id: string, patch: Partial<Incident>) => void;
}

export const useSentimentStore = create<SentimentStore>((set, get) => ({
  incidents: [],
  syncTemplates: [],
  currentUser: CURRENT_USER,

  getIncident: (id) => get().incidents.find((i) => i.id === id),

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
              assigneeName: assignedNames[dept]
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
        return {
          ...i,
          feedbacks: {
            ...i.feedbacks,
            [dept]: {
              ...fb,
              ...feedback,
              status: 'submitted',
              respondedAt: now
            }
          },
          timeline: [
            ...i.timeline,
            createTimelineEvent(
              'dept_feedback',
              fb.assigneeName,
              `${DEPT_LABELS[dept]}已反馈`,
              `事实说明已填写 ${feedback.factStatement.length} 字，口径已审定`,
              dept
            )
          ],
          updatedAt: now
        };
      })
    }));
    console.log('[Store] submitDeptFeedback:', { incidentId, dept });
  },

  getMergedFeedback: (incident) => {
    const fbs = Object.values(incident.feedbacks).filter(Boolean) as DeptFeedback[];
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

  addSyncTemplate: (tpl) => {
    const now = new Date().toISOString();
    const newTpl: SyncTemplate = {
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
                  '生成对内同步模板',
                  `共 ${tpl.suggestedActions.length} 项建议动作，下次观察：${tpl.nextCheckTime}`
                )
              ],
              updatedAt: now
            }
          : i
      )
    }));
    console.log('[Store] addSyncTemplate:', newTpl.id);
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
  useSentimentStore.setState({ incidents, syncTemplates: templates });
}

export function getCategoryFromIncidentId(incidentId: string): IncidentCategory | null {
  const inc = useSentimentStore.getState().incidents.find((i) => i.id === incidentId);
  return inc?.category || null;
}
