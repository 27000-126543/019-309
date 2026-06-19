import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TrendChart from '@/components/TrendChart';
import TagPanel from '@/components/TagPanel';
import DisposalTimeline from '@/components/DisposalTimeline';
import { useSentimentStore } from '@/store/useSentimentStore';
import {
  Incident,
  JudgeTag,
  CATEGORY_LABELS,
  URGENCY_LABELS,
  JUDGE_LABELS
} from '@/types/sentiment';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const paramId = router.params.id as string;
  const incidents = useSentimentStore((s) => s.incidents);
  const setJudge = useSentimentStore((s) => s.setJudge);

  const incident: Incident | undefined = useSentimentStore((s) =>
    s.incidents.find((i) => i.id === paramId) || s.incidents[0]
  );

  const fallbackId = incident?.id || 'INC-001';
  const [localJudge, setLocalJudge] = useState<JudgeTag | null>(incident?.judgeTag ?? null);
  const [localNote, setLocalNote] = useState<string>(incident?.judgeNote ?? '');

  useDidShow(() => {
    const fresh = useSentimentStore.getState().getIncident(fallbackId);
    if (fresh) {
      setLocalJudge(fresh.judgeTag);
      setLocalNote(fresh.judgeNote);
    }
    console.log('[Detail] 页面展示，事项ID:', fallbackId);
  });

  if (!incident) {
    return (
      <ScrollView className={styles.page}>
        <View className={styles.emptyTip}>事项不存在</View>
      </ScrollView>
    );
  }

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

  const judgeMap: Record<string, string> = {
    pending: styles.judgePending,
    exaggerate: styles.judgeExaggerate,
    oldnews: styles.judgeOldnews,
    malicious: styles.judgeMalicious
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

  const handleSave = () => {
    setJudge(incident.id, localJudge, localNote);
    Taro.showToast({ title: '初判结果已保存', icon: 'success' });
  };

  const handleCollaborate = () => {
    if (localJudge !== incident.judgeTag || localNote !== incident.judgeNote) {
      setJudge(incident.id, localJudge, localNote);
    }
    Taro.switchTab({ url: '/pages/collaborate/index' });
  };

  const handleSync = () => {
    Taro.switchTab({ url: '/pages/summary/index' });
  };

  void incidents; // 保持响应式订阅

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

        {incident.judgeTag && (
          <View className={styles.judgeInfo}>
            <View className={classnames(styles.judgeTag, judgeMap[incident.judgeTag])}>
              初判：{JUDGE_LABELS[incident.judgeTag]}
            </View>
            {incident.judgedBy && (
              <View className={classnames(styles.metaTag, styles.trendTag)}>
                by {incident.judgedBy}
              </View>
            )}
          </View>
        )}

        <Text className={styles.summary}>{incident.summary}</Text>
      </View>

      <View className={styles.content}>
        <TrendChart points={incident.trendPoints} currentHeat={incident.heat} />

        <DisposalTimeline incident={incident} />

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
          onChange={setLocalJudge}
          onNoteChange={setLocalNote}
        />
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.btnGhost} onClick={handleSave}>
          保存初判
        </Button>
        <Button className={styles.btnSecondary} onClick={handleSync}>
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
