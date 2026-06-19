import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TrendChart from '@/components/TrendChart';
import TagPanel from '@/components/TagPanel';
import { mockIncidents } from '@/data/mockSentiment';
import {
  Incident,
  JudgeTag,
  CATEGORY_LABELS,
  URGENCY_LABELS
} from '@/types/sentiment';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const incidentId = router.params.id || mockIncidents[0].id;

  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const incident = useMemo(
    () => incidents.find((i) => i.id === incidentId) || mockIncidents[0],
    [incidents, incidentId]
  );

  const [localJudge, setLocalJudge] = useState<JudgeTag | null>(incident.judgeTag);
  const [localNote, setLocalNote] = useState<string>(incident.judgeNote);

  useDidShow(() => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (inc) {
      setLocalJudge(inc.judgeTag);
      setLocalNote(inc.judgeNote);
    }
  });

  const urgencyMap: Record<string, string> = {
    critical: styles.urgencyCritical,
    high: styles.urgencyHigh,
    medium: styles.urgencyMedium,
    low: styles.urgencyLow
  };

  const catMap: Record<string, string> = {
    media: styles.catMedia,
    investor: styles.catInvestor,
    complaint: styles.catComplaint
  };

  const trendText =
    incident.heatTrend === 'rising'
      ? '↑ 升温中'
      : incident.heatTrend === 'falling'
      ? '↓ 降温中'
      : '→ 平稳';

  const formatTimeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}分钟前首发`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前首发`;
    return `${Math.floor(diff / 86400)}天前首发`;
  };

  const handleJudgeChange = (tag: JudgeTag | null) => {
    setLocalJudge(tag);
  };

  const handleSave = () => {
    const updated = incidents.map((i) =>
      i.id === incidentId
        ? { ...i, judgeTag: localJudge, judgeNote: localNote }
        : i
    );
    setIncidents(updated);
    Taro.showToast({ title: '初判结果已保存', icon: 'success' });
    console.log('[Detail] 初判已保存:', { id: incidentId, judge: localJudge, note: localNote });
  };

  const handleCollaborate = () => {
    if (localJudge) {
      const updated = incidents.map((i) =>
        i.id === incidentId
          ? { ...i, judgeTag: localJudge, judgeNote: localNote }
          : i
      );
      setIncidents(updated);
    }
    Taro.switchTab({ url: '/pages/collaborate/index' });
  };

  return (
    <ScrollView scrollY className={styles.page} enhanced showScrollbar={false}>
      <View className={styles.header}>
        <View className={styles.idBar}>
          <Text className={styles.idText}>事项编号 {incident.id}</Text>
          <View className={classnames(styles.urgencyBadge, urgencyMap[incident.urgency])}>
            {URGENCY_LABELS[incident.urgency]}
          </View>
        </View>

        <Text className={styles.title}>{incident.title}</Text>

        <View className={styles.metaRow}>
          <View className={classnames(styles.metaTag, catMap[incident.category])}>
            {CATEGORY_LABELS[incident.category]}
          </View>
          <View className={classnames(styles.metaTag, styles.heatTag)}>
            热度 {incident.heat.toLocaleString()}
          </View>
          <View className={classnames(styles.metaTag, styles.trendTag)}>
            {trendText}
          </View>
        </View>

        <Text className={styles.summary}>{incident.summary}</Text>
      </View>

      <View className={styles.content}>
        <TrendChart points={incident.trendPoints} currentHeat={incident.heat} />

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionTitleMain}>
              <View className={styles.sectionIcon}>📷</View>
              <Text>证据截图</Text>
            </View>
            <View className={styles.sectionCount}>{incident.evidenceImages.length} 张</View>
          </View>

          {incident.evidenceImages.length > 0 ? (
            <ScrollView scrollX className={styles.evidenceScroll} enhanced showScrollbar={false}>
              {incident.evidenceImages.map((img) => (
                <View key={img.id} className={styles.evidenceItem}>
                  <View className={styles.evidenceImgBox}>
                    <Image
                      src={img.url}
                      className={styles.evidenceImg}
                      mode="aspectFill"
                      onError={(e) => console.error('[Detail] 图片加载失败:', e)}
                    />
                  </View>
                  <Text className={styles.evidenceCaption}>{img.caption}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className={styles.emptyTip}>暂无截图证据</View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionTitleMain}>
              <View className={styles.sectionIcon}>💬</View>
              <Text>关键评论</Text>
            </View>
            <View className={styles.sectionCount}>{incident.keyComments.length} 条</View>
          </View>

          {incident.keyComments.length > 0 ? (
            <View className={styles.commentList}>
              {incident.keyComments.map((c) => (
                <View key={c.id} className={styles.commentCard}>
                  <View className={styles.commentHead}>
                    <View className={styles.commentAuthor}>
                      <View className={styles.authorAvatar}>
                        {c.author.slice(0, 1)}
                      </View>
                      <Text className={styles.authorName}>{c.author}</Text>
                      <Text className={styles.authorPlatform}>{c.platform}</Text>
                    </View>
                    <View className={styles.commentMeta}>
                      <Text className={styles.likes}>♥ {c.likes}</Text>
                      <Text className={styles.formatTime}>{formatTimeAgo(c.time)}</Text>
                    </View>
                  </View>
                  <Text className={styles.commentContent}>{c.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyTip}>暂无关键评论</View>
          )}
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionTitleMain}>
              <View className={styles.sectionIcon}>🔍</View>
              <Text>疑似源头</Text>
            </View>
          </View>
          <View className={styles.sourceCard}>
            <View className={styles.sourceIcon}>源</View>
            <View className={styles.sourceBody}>
              <Text className={styles.sourceLabel}>目前溯源结果：</Text>
              <Text className={styles.sourceContent}>{incident.suspectedSource}</Text>
              <Text className={styles.sourceTime}>{formatTimeAgo(incident.firstReportedAt)}</Text>
            </View>
          </View>
        </View>

        <TagPanel
          value={localJudge}
          note={localNote}
          onChange={handleJudgeChange}
          onNoteChange={setLocalNote}
        />
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.btnGhost} onClick={handleSave}>
          保存初判
        </Button>
        <Button className={styles.btnSecondary} onClick={() => Taro.switchTab({ url: '/pages/summary/index' })}>
          生成同步
        </Button>
        <Button className={styles.btnPrimary} onClick={handleCollaborate}>
          派单协同
        </Button>
      </View>
    </ScrollView>
  );
};

export default DetailPage;
