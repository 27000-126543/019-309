import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import IncidentCard from '@/components/IncidentCard';
import ShiftHandover from '@/components/ShiftHandover';
import { useSentimentStore } from '@/store/useSentimentStore';
import { Incident, IncidentCategory, CATEGORY_LABELS, URGENCY_LABELS } from '@/types/sentiment';

type FilterType = 'all' | IncidentCategory;
type ViewMode = 'list' | 'handover';

const URGENCY_COLORS: Record<string, string> = {
  critical: '#FF3B30',
  high: '#FF9500',
  medium: '#FFCC00',
  low: '#8E8E93'
};

const IndexPage: React.FC = () => {
  const incidents = useSentimentStore((s) => s.incidents);
  const currentIncidentId = useSentimentStore((s) => s.currentIncidentId);
  const setCurrentIncidentId = useSentimentStore((s) => s.setCurrentIncidentId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useDidShow(() => {
    console.log('[IndexPage] 页面展示，当前事项数:', incidents.length);
  });

  const filtered = useMemo(() => {
    let list = filter === 'all' ? incidents : incidents.filter((i) => i.category === filter);
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...list].sort((a, b) => {
      const ua = urgencyOrder[a.urgency];
      const ub = urgencyOrder[b.urgency];
      if (ua !== ub) return ua - ub;
      return b.heat - a.heat;
    });
  }, [incidents, filter]);

  const stats = useMemo(() => {
    return {
      critical: incidents.filter((i) => i.urgency === 'critical').length,
      high: incidents.filter((i) => i.urgency === 'high').length,
      medium: incidents.filter((i) => i.urgency === 'medium').length,
      low: incidents.filter((i) => i.urgency === 'low').length,
      open: incidents.filter((i) => i.status === 'open').length,
      total: incidents.length
    };
  }, [incidents]);

  const categoryCounts = useMemo(() => {
    return {
      all: incidents.length,
      media: incidents.filter((i) => i.category === 'media').length,
      investor: incidents.filter((i) => i.category === 'investor').length,
      complaint: incidents.filter((i) => i.category === 'complaint').length
    };
  }, [incidents]);

  const handleCardClick = (incident: Incident) => {
    setCurrentIncidentId(incident.id);
    Taro.navigateTo({
      url: `/pages/detail/index?id=${incident.id}`
    });
  };

  const currentIncident = useMemo(
    () => incidents.find((i) => i.id === currentIncidentId) || null,
    [incidents, currentIncidentId]
  );

  const handleCurrentClick = () => {
    if (currentIncident) {
      Taro.navigateTo({ url: `/pages/detail/index?id=${currentIncident.id}` });
    }
  };

  const formatTime = (d: Date) => {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const formatDate = (d: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  };

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部事项' },
    { key: 'media', label: CATEGORY_LABELS.media },
    { key: 'investor', label: CATEGORY_LABELS.investor },
    { key: 'complaint', label: CATEGORY_LABELS.complaint }
  ];

  const viewTabs: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'list', label: '事项列表', icon: '📋' },
    { key: 'handover', label: '交接班', icon: '🔄' }
  ];

  return (
    <ScrollView scrollY className={styles.page} enhanced showScrollbar={false}>
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View className={styles.timeBlock}>
            <Text className={styles.currentTime}>{formatTime(currentTime)}</Text>
            <Text className={styles.dateInfo}>{formatDate(currentTime)} · 午盘时段</Text>
          </View>
          <View className={styles.dutyInfo}>
            <Text className={styles.dutyLabel}>当前值班</Text>
            <Text className={styles.dutyName}>{useSentimentStore.getState().currentUser} · 品牌公关部</Text>
          </View>
        </View>

        <View className={styles.statusRow}>
          <View className={styles.alertCard}>
            <View className={styles.alertLabel}>
              <View className={styles.pulseDot}></View>
              <Text>需紧急处理</Text>
            </View>
            <Text className={styles.alertValue}>{stats.critical + stats.high}</Text>
          </View>
          <View className={styles.normalCard}>
            <Text className={styles.normalLabel}>监控中事项</Text>
            <Text className={styles.normalValue}>{stats.total}</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumCritical)}>{stats.critical}</Text>
            <Text className={styles.statLabel}>特急</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumHigh)}>{stats.high}</Text>
            <Text className={styles.statLabel}>紧急</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumMedium)}>{stats.medium}</Text>
            <Text className={styles.statLabel}>关注</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={classnames(styles.statNum, styles.statNumLow)}>{stats.low}</Text>
            <Text className={styles.statLabel}>观察</Text>
          </View>
        </View>
      </View>

      <View className={styles.viewTabs}>
        {viewTabs.map((tab) => (
          <Button
            key={tab.key}
            className={classnames(styles.viewTab, viewMode === tab.key && styles.viewTabActive)}
            onClick={() => setViewMode(tab.key)}
          >
            <Text className={styles.viewTabIcon}>{tab.icon}</Text>
            <Text className={styles.viewTabLabel}>{tab.label}</Text>
          </Button>
        ))}
      </View>

      {currentIncident && viewMode === 'list' && (
        <View className={styles.currentBar} onClick={handleCurrentClick}>
          <View className={styles.currentBarLeft}>
            <View className={styles.currentBadge}>
              <Text className={styles.currentBadgeText}>处理中</Text>
            </View>
            <Text
              className={styles.currentUrgency}
              style={{ color: URGENCY_COLORS[currentIncident.urgency] }}
            >
              {URGENCY_LABELS[currentIncident.urgency]}
            </Text>
          </View>
          <Text className={styles.currentTitle} numberOfLines={1}>
            {currentIncident.title}
          </Text>
          <View className={styles.currentArrow}>›</View>
        </View>
      )}

      {viewMode === 'list' ? (
        <>
          <View className={styles.tabsSection}>
            <ScrollView scrollX className={styles.tabsRow} enhanced showScrollbar={false}>
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  className={classnames(styles.tabItem, filter === tab.key && styles.tabItemActive)}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                  <Text className={styles.tabBadge}>{categoryCounts[tab.key]}</Text>
                </Button>
              ))}
            </ScrollView>
          </View>

          <View className={styles.sectionTitle}>
            <Text className={styles.sectionLabel}>升温事项列表</Text>
            <Text className={styles.sectionCount}>共 {filtered.length} 条，按紧急度排序</Text>
          </View>

          <View className={styles.listSection}>
            {filtered.length > 0 ? (
              filtered.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  isCurrent={incident.id === currentIncidentId}
                  onClick={() => handleCardClick(incident)}
                />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✓</Text>
                <Text className={styles.emptyText}>
                  当前分类暂无升温事项
                  {'\n'}
                  继续保持监控
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <ShiftHandover />
      )}
    </ScrollView>
  );
};

export default IndexPage;
