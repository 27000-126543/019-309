import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import {
  TimelineEvent,
  TIMELINE_EVENT_LABELS,
  DEPT_LABELS,
  Incident
} from '@/types/sentiment';

interface DisposalTimelineProps {
  incident: Incident;
}

const DisposalTimeline: React.FC<DisposalTimelineProps> = ({ incident }) => {
  const events = [...incident.timeline].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getProgress = () => {
    const types = events.map((e) => e.type);
    let pct = 10;
    if (types.includes('judge')) pct = 30;
    if (types.includes('assign')) pct = 50;
    if (types.includes('dept_feedback') || types.includes('dept_reject')) pct = 75;
    if (types.includes('shift_handover')) pct = 85;
    if (types.includes('generate_sync')) pct = 100;
    return pct;
  };

  const progress = getProgress();
  const typeClassMap: Record<string, string> = {
    first_report: styles.dotTypeFirst,
    judge: styles.dotTypeJudge,
    assign: styles.dotTypeAssign,
    dept_feedback: styles.dotTypeFeedback,
    dept_reject: styles.dotTypeReject,
    generate_sync: styles.dotTypeSync,
    shift_handover: styles.dotTypeHandover,
    status_change: styles.dotTypeStatus,
    note: styles.dotTypeNote
  };

  if (events.length === 0) {
    return (
      <View className={styles.panel}>
        <View className={styles.header}>
          <View className={styles.title}>
            <View className={styles.titleIcon}>⏱</View>
            <Text>处置时间线</Text>
          </View>
        </View>
        <View className={styles.emptyHint}>暂无处置记录</View>
      </View>
    );
  }

  return (
    <View className={styles.panel}>
      <View className={styles.header}>
        <View className={styles.title}>
          <View className={styles.titleIcon}>⏱</View>
          <Text>处置时间线</Text>
        </View>
        <View className={styles.progress}>
          <View className={styles.progressBar}>
            <View className={styles.progressFill} style={{ width: `${progress}%` }} />
          </View>
          <Text className={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      <View className={styles.timeline}>
        {events.map((event, idx) => {
          const isFirst = idx === 0;
          const isLatest = idx === events.length - 1;
          return (
            <View key={event.id} className={styles.item}>
              <View
                className={classnames(
                  styles.dot,
                  isFirst && styles.dotFirst,
                  isLatest && !isFirst && styles.dotLatest,
                  !isFirst && !isLatest && typeClassMap[event.type]
                )}
              />
              <View className={classnames(styles.itemContent, isLatest && styles.itemLatest)}>
                <View className={styles.itemTop}>
                  <Text className={styles.itemTitle}>{event.title}</Text>
                  <Text className={styles.itemTime}>{formatTime(event.time)}</Text>
                </View>
                <View className={styles.itemMeta}>
                  <View className={styles.itemActor}>{event.actor}</View>
                  <View className={styles.itemType}>
                    {TIMELINE_EVENT_LABELS[event.type]}
                  </View>
                  {event.dept && (
                    <View className={styles.itemDept}>{DEPT_LABELS[event.dept]}</View>
                  )}
                </View>
                <Text className={styles.itemDesc}>{event.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default DisposalTimeline;
