import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSentimentStore } from '@/store/useSentimentStore';
import {
  URGENCY_LABELS,
  CATEGORY_LABELS,
  DEPT_LABELS,
  DEPT_FEEDBACK_STATUS_LABELS,
  JudgeTag,
  JUDGE_LABELS,
  Incident,
  AssigneeDept,
  DeptFeedbackStatus,
  IncidentHandoverItem
} from '@/types/sentiment';

const URGENCY_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  high: '#FF9500',
  medium: '#FFCC00',
  low: '#8E8E93'
};

const TAG_COLORS: Record<JudgeTag, string> = {
  pending: '#FF9500',
  exaggerate: '#007AFF',
  oldnews: '#8E8E93',
  malicious: '#FF3B30'
};

const ShiftHandover: React.FC = () => {
  const sortedIncidents = useSentimentStore((s) => s.getSortedByUrgency());
  const currentIncidentId = useSentimentStore((s) => s.currentIncidentId);
  const currentUser = useSentimentStore((s) => s.currentUser);
  const setCurrentIncidentId = useSentimentStore((s) => s.setCurrentIncidentId);
  const getIncidentNextCheckTime = useSentimentStore((s) => s.getIncidentNextCheckTime);
  const confirmShiftHandover = useSentimentStore((s) => s.confirmShiftHandover);

  const initialItems = useMemo<IncidentHandoverItem[]>(
    () =>
      sortedIncidents.map((i) => ({
        incidentId: i.id,
        incidentTitle: i.title,
        read: false,
        note: ''
      })),
    [sortedIncidents]
  );

  const [items, setItems] = useState<IncidentHandoverItem[]>(initialItems);
  const [fromUser, setFromUser] = useState<string>('李值班（早班）');

  const allRead = items.every((i) => i.read);
  const readCount = items.filter((i) => i.read).length;

  const toggleRead = (incidentId: string) => {
    setItems(items.map((i) => (i.incidentId === incidentId ? { ...i, read: !i.read } : i)));
  };

  const updateNote = (incidentId: string, note: string) => {
    setItems(items.map((i) => (i.incidentId === incidentId ? { ...i, note } : i)));
  };

  const toggleAllRead = () => {
    const next = !allRead;
    setItems(items.map((i) => ({ ...i, read: next })));
  };

  const getAssignedDepts = (incident: Incident) => {
    return (Object.keys(incident.feedbacks) as AssigneeDept[]).filter(
      (d) => incident.feedbacks[d] !== null
    );
  };

  const getPendingDepts = (incident: Incident) => {
    return (Object.keys(incident.feedbacks) as AssigneeDept[]).filter((d) => {
      const fb = incident.feedbacks[d];
      return fb && fb.status !== 'submitted';
    }) as AssigneeDept[];
  };

  const getStatusColor = (status: DeptFeedbackStatus | null) => {
    if (!status) return '#8E8E93';
    if (status === 'submitted') return '#34C759';
    if (status === 'rejected') return '#FF3B30';
    if (status === 'in_progress') return '#FF9500';
    return '#8E8E93';
  };

  const handleRowClick = (incident: Incident) => {
    setCurrentIncidentId(incident.id);
    Taro.navigateTo({ url: `/pages/detail/index?id=${incident.id}` });
  };

  const handleConfirm = () => {
    if (readCount === 0) {
      Taro.showToast({ title: '请先勾选已阅读的事项', icon: 'none' });
      return;
    }
    confirmShiftHandover({
      fromUser,
      toUser: currentUser,
      incidentNotes: items.filter((i) => i.read)
    });
    Taro.showToast({ title: `已确认接班 ${readCount} 项`, icon: 'success' });
  };

  const now = new Date();
  const shiftTime = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <View className={styles.wrap}>
      <View className={styles.header}>
        <View className={styles.title}>
          <Text className={styles.titleIcon}>📋</Text>
          <Text className={styles.titleText}>交接班视图</Text>
        </View>
        <Text className={styles.shiftTime}>生成时间：{shiftTime}</Text>
      </View>

      <View className={styles.summaryRow}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{sortedIncidents.length}</Text>
          <Text className={styles.summaryLabel}>事项总数</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#FF3B30' }}>
            {sortedIncidents.filter((i) => i.urgency === 'critical').length}
          </Text>
          <Text className={styles.summaryLabel}>特急</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#FF9500' }}>
            {sortedIncidents.filter((i) => i.urgency === 'high').length}
          </Text>
          <Text className={styles.summaryLabel}>紧急</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>
            {sortedIncidents.reduce((acc, i) => acc + getPendingDepts(i).length, 0)}
          </Text>
          <Text className={styles.summaryLabel}>待反馈</Text>
        </View>
      </View>

      <View className={styles.handoverInfoBar}>
        <View className={styles.handoverInfo}>
          <Text className={styles.handoverInfoLabel}>交班人：</Text>
          <Textarea
            value={fromUser}
            onInput={(e) => setFromUser(e.detail.value)}
            className={styles.handoverInfoInput}
            placeholder="填写交班人姓名"
            maxlength={30}
            autoHeight
          />
        </View>
        <View className={styles.handoverInfo}>
          <Text className={styles.handoverInfoLabel}>接班人：</Text>
          <Text className={styles.handoverInfoValue}>{currentUser}</Text>
        </View>
      </View>

      <View className={styles.progressBar}>
        <View className={styles.progressRow}>
          <Text className={styles.progressLabel}>接班确认进度</Text>
          <Text className={styles.progressText}>
            {readCount} / {items.length} 已阅读
          </Text>
        </View>
        <View className={styles.progressTrack}>
          <View
            className={styles.progressFill}
            style={{ width: `${items.length ? (readCount / items.length) * 100 : 0}%` }}
          />
        </View>
        <View className={styles.progressActions}>
          <Button className={styles.progressToggleBtn} onClick={toggleAllRead}>
            {allRead ? '取消全选' : '全部标记已阅读'}
          </Button>
        </View>
      </View>

      {sortedIncidents.map((incident, idx) => {
        const item = items.find((i) => i.incidentId === incident.id);
        const nextCheck = getIncidentNextCheckTime(incident);
        const assigned = getAssignedDepts(incident);
        const pending = getPendingDepts(incident);
        const isCurrent = incident.id === currentIncidentId;

        return (
          <View
            key={incident.id}
            className={classnames(styles.row, item?.read && styles.rowRead, isCurrent && styles.rowCurrent)}
          >
            <View
              className={styles.readCheck}
              onClick={(e) => { e.stopPropagation && e.stopPropagation(); toggleRead(incident.id); }}
            >
              <View className={classnames(styles.checkBox, item?.read && styles.checkBoxChecked)}>
                {item?.read && <Text className={styles.checkMark}>✓</Text>}
              </View>
            </View>

            <View className={styles.rowBody} onClick={() => handleRowClick(incident)}>
              <View className={styles.tdPriority}>
                <View
                  className={styles.priorityBadge}
                  style={{ background: URGENCY_COLORS[incident.urgency] }}
                >
                  <Text className={styles.priorityText}>
                    {idx + 1} {URGENCY_LABELS[incident.urgency]}
                  </Text>
                </View>
                {isCurrent && (
                  <View className={styles.currentBadge}>
                    <Text className={styles.currentBadgeText}>处理中</Text>
                  </View>
                )}
              </View>

              <View className={styles.tdTitle}>
                <View className={styles.titleRow}>
                  <Text
                    className={styles.categoryTag}
                    style={{ background: TAG_COLORS[incident.judgeTag || 'pending'] }}
                  >
                    {incident.judgeTag ? JUDGE_LABELS[incident.judgeTag] : '待初判'}
                  </Text>
                  <Text className={styles.categoryText}>
                    {CATEGORY_LABELS[incident.category]}
                  </Text>
                  <Text className={styles.heatText}>🔥 {incident.heat.toLocaleString()}</Text>
                </View>
                <Text className={styles.incidentTitle}>{incident.title}</Text>
              </View>

              <View className={styles.tdDepts}>
                {assigned.length === 0 ? (
                  <Text className={styles.emptyText}>未派单</Text>
                ) : (
                  assigned.map((dept) => {
                    const fb = incident.feedbacks[dept]!;
                    return (
                      <View
                        key={dept}
                        className={classnames(
                          styles.deptTag,
                          fb.status === 'rejected' && styles.deptTagRejected
                        )}
                        style={{ borderColor: getStatusColor(fb.status) }}
                      >
                        <Text
                          className={styles.deptTagText}
                          style={{ color: getStatusColor(fb.status) }}
                        >
                          {DEPT_LABELS[dept]}
                          {fb.status === 'rejected' && ' !'}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>

              <View className={styles.tdPending}>
                {pending.length === 0 ? (
                  <Text className={styles.doneText}>✓ 全部反馈</Text>
                ) : (
                  pending.map((dept) => (
                    <Text key={dept} className={styles.pendingText}>
                      {DEPT_LABELS[dept]}
                      <Text className={styles.pendingStatus}>
                        （{DEPT_FEEDBACK_STATUS_LABELS[incident.feedbacks[dept]!.status]}）
                      </Text>
                    </Text>
                  ))
                )}
              </View>

              <View className={styles.tdNext}>
                {nextCheck ? (
                  <Text className={styles.nextCheck}>{nextCheck}</Text>
                ) : (
                  <Text className={styles.emptyText}>未安排</Text>
                )}
              </View>
            </View>

            <View className={styles.noteSection}>
              <Text className={styles.noteLabel}>交接备注（可选）：</Text>
              <Textarea
                value={item?.note || ''}
                onInput={(e) => updateNote(incident.id, e.detail.value)}
                className={styles.noteInput}
                placeholder="请填写对该事项的交接备注，例如：需重点盯紧法务反馈..."
                maxlength={100}
                autoHeight
              />
            </View>
          </View>
        );
      })}

      <View className={styles.confirmBar}>
        <Button
          className={classnames(styles.confirmBtn, readCount > 0 && styles.confirmBtnActive)}
          onClick={handleConfirm}
          disabled={readCount === 0}
        >
          ✅ 确认接班（{readCount}/{items.length}）
        </Button>
      </View>
    </View>
  );
};

export default ShiftHandover;
