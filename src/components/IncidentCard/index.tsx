import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import {
  Incident,
  CATEGORY_LABELS,
  URGENCY_LABELS,
  JUDGE_LABELS,
  DEPT_LABELS
} from '@/types/sentiment';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

const formatTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
};

const getTrendText = (trend: string) => {
  if (trend === 'rising') return '↑ 升温中';
  if (trend === 'falling') return '↓ 降温中';
  return '→ 平稳';
};

const STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  assigned: '已派单',
  confirmed: '已核实',
  closed: '已归档'
};

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick }) => {
  const urgencyMap: Record<string, string> = {
    critical: styles.urgencyCritical,
    high: styles.urgencyHigh,
    medium: styles.urgencyMedium,
    low: styles.urgencyLow
  };

  const categoryMap: Record<string, string> = {
    media: styles.catMedia,
    investor: styles.catInvestor,
    complaint: styles.catComplaint
  };

  const judgeMap: Record<string, string> = {
    pending: styles.judgePending,
    exaggerate: styles.judgeExaggerate,
    oldnews: styles.judgeOldnews,
    malicious: styles.judgeMalicious
  };

  const statusMap: Record<string, string> = {
    open: styles.statusOpen,
    assigned: styles.statusAssigned,
    confirmed: styles.statusConfirmed,
    closed: styles.statusClosed
  };

  return (
    <View
      className={classnames(
        styles.card,
        incident.urgency === 'critical' && styles.critical,
        incident.urgency === 'high' && styles.high,
        incident.urgency === 'medium' && styles.medium,
        incident.urgency === 'low' && styles.low
      )}
      onClick={onClick}
    >
      <View className={styles.header}>
        <Text className={styles.title}>{incident.title}</Text>
        <View className={classnames(styles.urgencyBadge, urgencyMap[incident.urgency])}>
          {URGENCY_LABELS[incident.urgency]}
        </View>
      </View>

      <View className={styles.metaRow}>
        <View className={classnames(styles.categoryTag, categoryMap[incident.category])}>
          {CATEGORY_LABELS[incident.category]}
        </View>
        <View className={styles.heatInfo}>
          <Text>热度</Text>
          <Text className={styles.heatValue}>{incident.heat.toLocaleString()}</Text>
          <Text className={classnames(
            styles.trendIcon,
            incident.heatTrend === 'rising' && styles.trendRising,
            incident.heatTrend === 'stable' && styles.trendStable,
            incident.heatTrend === 'falling' && styles.trendFalling
          )}>
            {getTrendText(incident.heatTrend)}
          </Text>
        </View>
        {incident.judgeTag && (
          <View className={classnames(styles.judgeTag, judgeMap[incident.judgeTag])}>
            {JUDGE_LABELS[incident.judgeTag]}
          </View>
        )}
      </View>

      <Text className={styles.summary}>{incident.summary}</Text>

      <View className={styles.footer}>
        <Text className={styles.timeInfo}>
          首发于 {formatTime(incident.firstReportedAt)}
        </Text>
        {incident.assignees.length > 0 ? (
          <View className={styles.assigneeList}>
            {incident.assignees.map((dept) => (
              <View key={dept} className={styles.assigneeTag}>
                {DEPT_LABELS[dept]}
              </View>
            ))}
          </View>
        ) : (
          <View className={classnames(styles.statusTag, statusMap[incident.status])}>
            {STATUS_LABELS[incident.status]}
          </View>
        )}
      </View>
    </View>
  );
};

export default IncidentCard;
