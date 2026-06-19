import React from 'react';
import { View, Text } from '@tarojs/components';
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
  DeptFeedbackStatus
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
  const setCurrentIncidentId = useSentimentStore((s) => s.setCurrentIncidentId);
  const getIncidentNextCheckTime = useSentimentStore((s) => s.getIncidentNextCheckTime);

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

      <View className={styles.tableHeader}>
        <Text className={styles.thPriority}>优先级</Text>
        <Text className={styles.thTitle}>事项</Text>
        <Text className={styles.thDepts}>已派部门</Text>
        <Text className={styles.thPending}>待反馈</Text>
        <Text className={styles.thNext}>下次观察</Text>
      </View>

      {sortedIncidents.map((incident, idx) => {
        const nextCheck = getIncidentNextCheckTime(incident);
        const assigned = getAssignedDepts(incident);
        const pending = getPendingDepts(incident);
        const isCurrent = incident.id === currentIncidentId;

        return (
          <View
            key={incident.id}
            className={classnames(styles.row, isCurrent && styles.rowCurrent)}
            onClick={() => handleRowClick(incident)}
          >
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
        );
      })}
    </View>
  );
};

export default ShiftHandover;
