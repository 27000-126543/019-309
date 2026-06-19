import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSentimentStore } from '@/store/useSentimentStore';
import {
  Incident,
  AssigneeDept,
  DeptFeedbackStatus,
  DEPT_LABELS,
  CATEGORY_LABELS,
  URGENCY_LABELS
} from '@/types/sentiment';

type LocalDeptDraft = {
  factStatement: string;
  publicStatement: string;
  noResponseBoundary: string;
};

const DEPT_ORDER: AssigneeDept[] = ['legal', 'business', 'secretary'];

const CollaboratePage: React.FC = () => {
  const incidents = useSentimentStore((s) => s.incidents);
  const currentIncidentId = useSentimentStore((s) => s.currentIncidentId);
  const assignDept = useSentimentStore((s) => s.assignDept);
  const submitDeptFeedback = useSentimentStore((s) => s.submitDeptFeedback);
  const rejectDeptFeedback = useSentimentStore((s) => s.rejectDeptFeedback);
  const setCurrentIncidentId = useSentimentStore((s) => s.setCurrentIncidentId);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, LocalDeptDraft>>({});
  const [rejectDept, setRejectDept] = useState<AssigneeDept | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const activeId = currentIncidentId || incidents[0]?.id || '';

  const incident: Incident | undefined = useMemo(
    () => incidents.find((i) => i.id === activeId),
    [incidents, activeId]
  );

  useDidShow(() => {
    const fresh = incidents.find((i) => i.id === activeId);
    if (fresh) {
      const next: Record<string, LocalDeptDraft> = {};
      DEPT_ORDER.forEach((d) => {
        const fb = fresh.feedbacks[d];
        if (fb) {
          next[d] = {
            factStatement: fb.factStatement,
            publicStatement: fb.publicStatement,
            noResponseBoundary: fb.noResponseBoundary
          };
        }
      });
      setDrafts(next);
    }
    console.log('[Collaborate] 页面展示，当前事项:', activeId);
  });

  if (!incident) {
    return (
      <ScrollView className={styles.page}>
        <View className={styles.emptyTip}>暂无正在处理的事项</View>
      </ScrollView>
    );
  }

  const getStatus = (dept: AssigneeDept): DeptFeedbackStatus | 'unassigned' => {
    const fb = incident.feedbacks[dept];
    return fb ? fb.status : 'unassigned';
  };

  const progress = useMemo(() => {
    let done = 0, assigned = 0;
    DEPT_ORDER.forEach((d) => {
      const fb = incident.feedbacks[d];
      if (fb) {
        assigned++;
        if (fb.status === 'submitted') done++;
      }
    });
    return { done, assigned, total: DEPT_ORDER.length };
  }, [incident]);

  const handleAssign = (dept: AssigneeDept) => {
    assignDept(incident.id, [dept]);
    setDrafts((prev) => ({
      ...prev,
      [dept]: prev[dept] || { factStatement: '', publicStatement: '', noResponseBoundary: '' }
    }));
    Taro.showToast({ title: `已派单给${DEPT_LABELS[dept]}`, icon: 'success' });
  };

  const handleDraftChange = (
    dept: AssigneeDept,
    field: keyof LocalDeptDraft,
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [dept]: {
        factStatement: prev[dept]?.factStatement || '',
        publicStatement: prev[dept]?.publicStatement || '',
        noResponseBoundary: prev[dept]?.noResponseBoundary || '',
        ...prev[dept],
        [field]: value
      }
    }));
  };

  const handleSubmit = (dept: AssigneeDept) => {
    const draft = drafts[dept];
    if (!draft) return;
    if (!draft.factStatement.trim() || !draft.publicStatement.trim()) {
      Taro.showToast({ title: '请填写事实说明与可公开口径', icon: 'none' });
      return;
    }
    submitDeptFeedback(incident.id, dept, draft);
    Taro.showToast({ title: `${DEPT_LABELS[dept]}反馈已保存`, icon: 'success' });
  };

  const handleRejectConfirm = () => {
    if (!rejectDept) return;
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请填写退回原因', icon: 'none' });
      return;
    }
    rejectDeptFeedback(incident.id, rejectDept, rejectReason.trim());
    setRejectDept(null);
    setRejectReason('');
    Taro.showToast({ title: `已退回${DEPT_LABELS[rejectDept]}反馈`, icon: 'success' });
  };

  const deptIconMap: Record<AssigneeDept, string> = {
    legal: '⚖',
    business: '📊',
    secretary: '📋'
  };
  const deptIconStyleMap: Record<AssigneeDept, string> = {
    legal: styles.iconLegal,
    business: styles.iconBusiness,
    secretary: styles.iconSecretary
  };

  const statusTextMap: Record<string, string> = {
    submitted: '已反馈',
    in_progress: '处理中',
    pending: '待处理',
    rejected: '需补充',
    unassigned: '未派单'
  };

  const statusStyleMap: Record<string, string> = {
    submitted: styles.statusSubmitted,
    in_progress: styles.statusInProgress,
    pending: styles.statusPending,
    rejected: styles.statusRejected,
    unassigned: styles.statusUnassigned
  };

  const cardStatusClassMap: Record<string, string> = {
    submitted: styles.cardSubmitted,
    in_progress: styles.cardInProgress,
    pending: styles.cardPending,
    rejected: styles.cardRejected,
    unassigned: styles.cardUnassigned
  };

  const overviewStatusClassMap: Record<string, string> = {
    submitted: styles.submitted,
    in_progress: styles.inProgress,
    pending: styles.pending,
    rejected: styles.rejected,
    unassigned: styles.unassigned
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView scrollY className={styles.page} enhanced showScrollbar={false}>
      <View className={styles.topBar}>
        <View
          className={styles.incidentPicker}
          onClick={() => setPickerVisible(true)}
        >
          <View className={styles.pickerInfo}>
            <Text className={styles.pickerTitle}>{incident.title}</Text>
            <Text className={styles.pickerMeta}>
              {incident.id} · {CATEGORY_LABELS[incident.category]} · {URGENCY_LABELS[incident.urgency]}
            </Text>
          </View>
          <Text className={styles.pickerArrow}>›</Text>
        </View>
      </View>

      <View className={styles.overview}>
        <View className={styles.overviewCard}>
          <View className={styles.overviewHeader}>
            <View className={styles.overviewTitle}>
              <Text>🎯 协同处置总览</Text>
            </View>
            <Text className={styles.progressText}>
              {progress.assigned > 0 ? `${progress.done}/${progress.assigned} 已反馈` : '尚未派单'}
            </Text>
          </View>
          <View className={styles.deptGrid}>
            {DEPT_ORDER.map((d) => {
              const s = getStatus(d);
              return (
                <View
                  key={d}
                  className={classnames(styles.deptOverview, overviewStatusClassMap[s])}
                >
                  <Text className={styles.deptName}>{DEPT_LABELS[d]}</Text>
                  <View className={classnames(styles.deptStatus, statusStyleMap[s])}>
                    <View className={styles.deptDot} />
                    <Text>{statusTextMap[s]}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View className={styles.content}>
        {DEPT_ORDER.map((dept) => {
          const s = getStatus(dept);
          const fb = incident.feedbacks[dept];
          const draft = drafts[dept] || { factStatement: '', publicStatement: '', noResponseBoundary: '' };
          const isSubmitted = s === 'submitted';
          const isRejected = s === 'rejected';
          const isAssigned = s !== 'unassigned';
          const canEdit = isRejected || s === 'in_progress' || s === 'pending';

          return (
            <View
              key={dept}
              className={classnames(styles.deptCard, cardStatusClassMap[s])}
            >
              <View className={styles.deptCardHeader}>
                <View className={styles.deptHeaderLeft}>
                  <View className={classnames(styles.deptIcon, deptIconStyleMap[dept])}>
                    {deptIconMap[dept]}
                  </View>
                  <View>
                    <Text className={styles.deptCardTitle}>{DEPT_LABELS[dept]}</Text>
                    <Text className={styles.deptAssignee}>
                      {fb ? `负责人：${fb.assigneeName}` : '尚未派单，点击右侧按钮分配'}
                    </Text>
                  </View>
                </View>
                <View className={classnames(styles.deptStatusBadge, statusStyleMap[s])}>
                  {s === 'submitted' && '✓'}
                  {s === 'rejected' && '!'}
                  <Text>{statusTextMap[s]}</Text>
                </View>
              </View>

              {isRejected && fb?.rejectReason && (
                <View className={styles.rejectInfo}>
                  <Text className={styles.rejectLabel}>退回原因：</Text>
                  <Text className={styles.rejectText}>{fb.rejectReason}</Text>
                  {fb.rejectedAt && (
                    <Text className={styles.rejectTime}>
                      {formatTime(fb.rejectedAt)} 退回
                    </Text>
                  )}
                </View>
              )}

              {isRejected && fb?.previousContent && (
                <View className={styles.prevContent}>
                  <View className={styles.prevContentHeader}>
                    <Text className={styles.prevContentIcon}>📜</Text>
                    <Text className={styles.prevContentTitle}>上次提交内容（请参考后补充）</Text>
                  </View>
                  <View className={styles.prevContentBody}>
                    <View className={styles.prevField}>
                      <Text className={styles.prevFieldLabel}>事实说明：</Text>
                      <Text className={styles.prevFieldValue}>{fb.previousContent.factStatement || '（空）'}</Text>
                    </View>
                    <View className={styles.prevField}>
                      <Text className={styles.prevFieldLabel}>可公开口径：</Text>
                      <Text className={styles.prevFieldValue}>{fb.previousContent.publicStatement || '（空）'}</Text>
                    </View>
                    <View className={styles.prevField}>
                      <Text className={styles.prevFieldLabel}>不能回应的边界：</Text>
                      <Text className={styles.prevFieldValue}>{fb.previousContent.noResponseBoundary || '（空）'}</Text>
                    </View>
                  </View>
                </View>
              )}

              {!isAssigned ? (
                <View className={styles.assignRow}>
                  <Text className={styles.assignText}>
                    当前未派单给{DEPT_LABELS[dept]}，点击立即指派
                  </Text>
                  <Button
                    className={styles.assignBtn}
                    onClick={() => handleAssign(dept)}
                  >
                    + 派单
                  </Button>
                </View>
              ) : (
                <>
                  <View className={styles.fieldGroup}>
                    <View className={styles.field}>
                      <View className={styles.fieldLabel}>
                        <View className={classnames(styles.fieldLabelDot, styles.dotFact)} />
                        <Text>事实说明</Text>
                        <Text className={styles.fieldHint}>仅限事实，不带主观判断</Text>
                      </View>
                      <Textarea
                        value={draft.factStatement}
                        onInput={(e) => handleDraftChange(dept, 'factStatement', e.detail.value)}
                        className={classnames(styles.textarea, !canEdit && styles.readonly)}
                        placeholder={`请${DEPT_LABELS[dept]}填写经过确认的客观事实...`}
                        maxlength={500}
                        disabled={!canEdit}
                        autoHeight
                      />
                    </View>

                    <View className={styles.field}>
                      <View className={styles.fieldLabel}>
                        <View className={classnames(styles.fieldLabelDot, styles.dotPublic)} />
                        <Text>可公开口径</Text>
                        <Text className={styles.fieldHint}>用于对外回复的统一话术</Text>
                      </View>
                      <Textarea
                        value={draft.publicStatement}
                        onInput={(e) => handleDraftChange(dept, 'publicStatement', e.detail.value)}
                        className={classnames(styles.textarea, !canEdit && styles.readonly)}
                        placeholder="请填写可对外公开的统一回复口径..."
                        maxlength={500}
                        disabled={!canEdit}
                        autoHeight
                      />
                    </View>

                    <View className={styles.field}>
                      <View className={styles.fieldLabel}>
                        <View className={classnames(styles.fieldLabelDot, styles.dotBoundary)} />
                        <Text>不能回应的边界</Text>
                        <Text className={styles.fieldHint}>红线提示，避免出错</Text>
                      </View>
                      <Textarea
                        value={draft.noResponseBoundary}
                        onInput={(e) => handleDraftChange(dept, 'noResponseBoundary', e.detail.value)}
                        className={classnames(styles.textarea, !canEdit && styles.readonly)}
                        placeholder="请说明不能对外回应的敏感信息和边界..."
                        maxlength={500}
                        disabled={!canEdit}
                        autoHeight
                      />
                    </View>
                  </View>

                  <View className={styles.deptCardFooter}>
                    <Text className={styles.lastUpdate}>
                      {fb?.respondedAt
                        ? `反馈时间：${formatTime(fb.respondedAt)}`
                        : fb?.assignedAt
                        ? `派单时间：${formatTime(fb.assignedAt)}`
                        : ''}
                    </Text>
                    <View className={styles.footerBtns}>
                      {isSubmitted && (
                        <Button
                          className={styles.rejectBtn}
                          onClick={() => {
                            setRejectDept(dept);
                            setRejectReason('');
                          }}
                        >
                          退回补充
                        </Button>
                      )}
                      <Button
                        className={isSubmitted ? styles.saveBtnOutline : styles.saveBtn}
                        onClick={() => handleSubmit(dept)}
                        disabled={isSubmitted}
                      >
                        {isRejected ? '重新提交' : isSubmitted ? '✓ 已提交' : '保存反馈'}
                      </Button>
                    </View>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.footerBar}>
        <Button
          className={styles.btnGhost}
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          返回值班本
        </Button>
        <Button
          className={styles.btnPrimary}
          onClick={() => {
            setCurrentIncidentId(incident.id);
            Taro.switchTab({ url: '/pages/summary/index' });
          }}
        >
          前往生成同步
        </Button>
      </View>

      {pickerVisible && (
        <View className={styles.modalMask} onClick={() => setPickerVisible(false)}>
          <View className={styles.modalSheet} onClick={(e) => e.stopPropagation && e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择事项</Text>
              <Text className={styles.modalClose} onClick={() => setPickerVisible(false)}>
                ×
              </Text>
            </View>
            <ScrollView scrollY className={styles.modalList} enhanced showScrollbar={false}>
              {incidents.map((inc) => (
                <View
                  key={inc.id}
                  className={classnames(styles.modalItem, inc.id === activeId && styles.active)}
                  onClick={() => {
                    setCurrentIncidentId(inc.id);
                    setPickerVisible(false);
                  }}
                >
                  <Text>{inc.title}</Text>
                  <View className={styles.modalItemMeta}>
                    {inc.id} · {CATEGORY_LABELS[inc.category]} · {URGENCY_LABELS[inc.urgency]}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {rejectDept && (
        <View className={styles.modalMask} onClick={() => setRejectDept(null)}>
          <View className={styles.modalSheet} onClick={(e) => e.stopPropagation && e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>退回{DEPT_LABELS[rejectDept]}反馈</Text>
              <Text className={styles.modalClose} onClick={() => setRejectDept(null)}>×</Text>
            </View>
            <View style={{ padding: '24rpx 32rpx' }}>
              <Text style={{ fontSize: '28rpx', color: '#4E5969', marginBottom: '16rpx', display: 'block' }}>
                请说明退回原因，{DEPT_LABELS[rejectDept]}将收到通知后补充
              </Text>
              <Textarea
                value={rejectReason}
                onInput={(e) => setRejectReason(e.detail.value)}
                className={styles.textarea}
                placeholder="例如：事实说明缺少关键时间节点，口径需要更严谨..."
                maxlength={200}
                autoHeight
                style={{ minHeight: '200rpx' }}
              />
              <View style={{ display: 'flex', gap: '16rpx', marginTop: '24rpx' }}>
                <Button
                  className={styles.btnGhost}
                  style={{ flex: 1 }}
                  onClick={() => setRejectDept(null)}
                >
                  取消
                </Button>
                <Button
                  className={styles.btnPrimary}
                  style={{ flex: 2 }}
                  onClick={handleRejectConfirm}
                >
                  确认退回
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default CollaboratePage;
