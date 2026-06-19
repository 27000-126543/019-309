import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSentimentStore } from '@/store/useSentimentStore';
import {
  Incident,
  IncidentCategory,
  SyncTemplate,
  CATEGORY_LABELS,
  URGENCY_LABELS,
  CATEGORY_TEMPLATES
} from '@/types/sentiment';

const SummaryPage: React.FC = () => {
  const incidents = useSentimentStore((s) => s.incidents);
  const syncTemplates = useSentimentStore((s) => s.syncTemplates);
  const getMergedFeedback = useSentimentStore((s) => s.getMergedFeedback);
  const addSyncTemplate = useSentimentStore((s) => s.addSyncTemplate);

  const [selectedId, setSelectedId] = useState<string>(incidents[0]?.id || '');
  const [pickerVisible, setPickerVisible] = useState(false);

  const [progressText, setProgressText] = useState<string>('');
  const [actions, setActions] = useState<string[]>([]);
  const [nextCheckTime, setNextCheckTime] = useState<string>('');

  const incident: Incident | undefined = useMemo(
    () => incidents.find((i) => i.id === selectedId),
    [incidents, selectedId]
  );

  const category: IncidentCategory = incident?.category || 'media';
  const tplConfig = CATEGORY_TEMPLATES[category];

  const resetForm = (inc: Incident) => {
    const merged = getMergedFeedback(inc);
    const factsParts = [merged.factStatement, merged.publicStatement]
      .filter(Boolean)
      .map((s) => s.replace(/\n+/g, ' ').slice(0, 80))
      .join(' ');

    const defaultProgress = factsParts
      ? `${factsParts}。${tplConfig.progressTemplate}`
      : tplConfig.progressTemplate;

    setProgressText(defaultProgress);
    setActions([...tplConfig.suggestedActions]);

    const defaultNext = new Date(Date.now() + tplConfig.defaultNextCheckMinutes * 60 * 1000);
    const nextStr = `${defaultNext.getMonth() + 1}月${defaultNext.getDate()}日 ${String(defaultNext.getHours()).padStart(2, '0')}:${String(defaultNext.getMinutes()).padStart(2, '0')}`;
    setNextCheckTime(nextStr);
  };

  useDidShow(() => {
    const fresh = incidents.find((i) => i.id === selectedId);
    if (fresh) resetForm(fresh);
    console.log('[Summary] 页面展示，当前事项:', selectedId, '模板条数:', syncTemplates.length);
  });

  useEffect(() => {
    if (incident && !progressText) resetForm(incident);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, incident?.id]);

  void syncTemplates;

  if (!incident) {
    return (
      <ScrollView className={styles.page}>
        <View className={styles.emptyTip}>暂无正在处理的事项</View>
      </ScrollView>
    );
  }

  const handleAddAction = () => {
    setActions([...actions, '']);
  };

  const handleActionChange = (idx: number, val: string) => {
    const next = [...actions];
    next[idx] = val;
    setActions(next);
  };

  const handleActionDel = (idx: number) => {
    if (actions.length <= 1) return;
    const next = actions.filter((_, i) => i !== idx);
    setActions(next);
  };

  const handleGenerate = () => {
    if (!progressText.trim()) {
      Taro.showToast({ title: '请填写进展说明', icon: 'none' });
      return;
    }
    if (actions.filter((a) => a.trim()).length === 0) {
      Taro.showToast({ title: '请至少填写一条建议动作', icon: 'none' });
      return;
    }
    addSyncTemplate({
      incidentId: incident.id,
      incidentTitle: incident.title,
      category: incident.category,
      progressText: progressText.trim(),
      suggestedActions: actions.filter((a) => a.trim()),
      nextCheckTime: nextCheckTime.trim() || '待确认',
      factStatement: getMergedFeedback(incident).factStatement,
      publicStatement: getMergedFeedback(incident).publicStatement,
      noResponseBoundary: getMergedFeedback(incident).noResponseBoundary
    });
    Taro.showToast({ title: '同步模板已生成', icon: 'success' });
  };

  const handleReuse = (tpl: SyncTemplate) => {
    setSelectedId(tpl.incidentId);
    setProgressText(tpl.progressText);
    setActions([...tpl.suggestedActions]);
    setNextCheckTime(tpl.nextCheckTime);
    Taro.showToast({ title: `已复用「${tpl.incidentTitle.slice(0, 10)}」的同步模板`, icon: 'none' });
  };

  const handleCopy = () => {
    const actionStr = actions
      .filter((a) => a.trim())
      .map((a, i) => `${i + 1}. ${a}`)
      .join('\n');
    const final =
      `【舆情同步】${incident.title}\n\n` +
      `📌 事项进展：\n${progressText}\n\n` +
      `🎯 建议动作：\n${actionStr}\n\n` +
      `⏰ 下次观察：${nextCheckTime}\n\n` +
      `—— 值班内同步，请勿外传`;
    Taro.setClipboardData({
      data: final,
      success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const historyForCurrent = syncTemplates.filter((t) => t.incidentId === incident.id);
  const historyAll = syncTemplates;

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

      <View className={styles.content}>
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionIcon}>📝</View>
              <Text>进展说明</Text>
            </View>
            <View className={styles.badge}>{CATEGORY_LABELS[incident.category]}模板</View>
          </View>
          <Text className={styles.categoryNote}>
            已根据「{CATEGORY_LABELS[incident.category]}」类型预置模板，并自动带出协同页填写的事实和口径
          </Text>
          <View className={styles.field}>
            <View className={styles.fieldLabel}>
              <Text>当前进展汇总</Text>
              <Text className={styles.fieldHint}>适合复制到内部群</Text>
            </View>
            <Textarea
              value={progressText}
              onInput={(e) => setProgressText(e.detail.value)}
              className={styles.textarea}
              placeholder="请描述当前事项进展..."
              maxlength={1000}
              autoHeight
            />
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionIcon}>🎯</View>
              <Text>建议动作</Text>
            </View>
          </View>
          <View className={styles.actionsHeader}>
            <Text className={styles.fieldHint}>
              已预置 {tplConfig.suggestedActions.length} 条场景化建议，可自由增删
            </Text>
            <Button className={styles.addActionBtn} onClick={handleAddAction}>
              + 新增
            </Button>
          </View>
          <View className={styles.actionList}>
            {actions.map((a, i) => (
              <View key={i} className={styles.actionItem}>
                <View className={styles.actionNum}>{i + 1}</View>
                <Textarea
                  value={a}
                  onInput={(e) => handleActionChange(i, e.detail.value)}
                  className={styles.actionInput}
                  placeholder="请输入建议动作..."
                  maxlength={200}
                  autoHeight
                />
                {actions.length > 1 && (
                  <Text className={styles.actionDel} onClick={() => handleActionDel(i)}>
                    ×
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionIcon}>⏰</View>
              <Text>下一次观察时间</Text>
            </View>
          </View>
          <Text className={styles.categoryNote}>
            「{CATEGORY_LABELS[incident.category]}」类默认建议 {tplConfig.defaultNextCheckMinutes} 分钟后观察
          </Text>
          <View className={styles.field}>
            <View className={styles.fieldLabel}>
              <Text>下次观察节点</Text>
            </View>
            <Input
              value={nextCheckTime}
              onInput={(e) => setNextCheckTime(e.detail.value)}
              className={styles.textarea}
              placeholder="例如：6月12日 15:30"
            />
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionIcon}>👁</View>
              <Text>同步模板预览</Text>
            </View>
          </View>
          <View className={styles.previewCard}>
            <View className={styles.previewTitle}>
              <Text>【舆情同步】{incident.title}</Text>
            </View>
            <Text className={styles.previewBody}>
              📌 事项进展：{'\n'}
              {progressText || '（待填写）'}
            </Text>
            <View className={styles.previewActions}>
              <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '12rpx', display: 'block' }}>
                🎯 建议动作：
              </Text>
              {actions.filter((a) => a.trim()).map((a, i) => (
                <Text key={i} selectable>
                  {i + 1}. {a}{'\n'}
                </Text>
              ))}
              {actions.filter((a) => a.trim()).length === 0 && (
                <Text style={{ fontSize: '26rpx', color: '#86909C' }}>（暂无）</Text>
              )}
            </View>
            <Text className={styles.previewFooter}>
              ⏰ 下次观察：{nextCheckTime || '待确认'}
              {'\n'}
              —— 值班内同步，请勿外传
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.historySection}>
        <View className={styles.historyHeader}>
          <View className={styles.historyTitle}>
            <Text>📚 历史同步记录</Text>
          </View>
          <View className={styles.historyCount}>{historyAll.length} 条</View>
        </View>
        {historyAll.length === 0 ? (
          <View className={styles.emptyTip}>暂无历史同步记录，保存后可在此复用</View>
        ) : (
          historyAll.map((tpl) => (
            <View key={tpl.id} className={styles.historyCard}>
              <View className={styles.historyHead}>
                <Text className={styles.historyIncident}>{tpl.incidentTitle}</Text>
                <Text className={styles.historyTime}>{formatTime(tpl.generatedAt)}</Text>
              </View>
              <Text className={styles.historyPreview}>{tpl.progressText}</Text>
              <View className={styles.historyMeta}>
                <View className={styles.historyMetaLeft}>
                  <View className={styles.historyTag}>{CATEGORY_LABELS[tpl.category]}</View>
                  <View className={styles.historyTag}>{tpl.suggestedActions.length} 项动作</View>
                  <View className={styles.historyTag}>by {tpl.generatedBy}</View>
                </View>
                <Button className={styles.reuseBtn} onClick={() => handleReuse(tpl)}>
                  复用
                </Button>
              </View>
            </View>
          ))
        )}
        {historyForCurrent.length > 0 && historyForCurrent.length !== historyAll.length && (
          <Text style={{ fontSize: '22rpx', color: '#86909C', padding: '16rpx', textAlign: 'center' }}>
            当前事项已生成 {historyForCurrent.length} 份同步
          </Text>
        )}
      </View>

      <View className={styles.footerBar}>
        <Button
          className={styles.btnGhost}
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          返回值班本
        </Button>
        <Button className={styles.btnSecondary} onClick={handleCopy}>
          复制
        </Button>
        <Button className={styles.btnPrimary} onClick={handleGenerate}>
          生成同步
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
                  className={classnames(styles.modalItem, inc.id === selectedId && styles.active)}
                  onClick={() => {
                    setSelectedId(inc.id);
                    setPickerVisible(false);
                    setTimeout(() => {
                      const fresh = useSentimentStore.getState().incidents.find((i) => i.id === inc.id);
                      if (fresh) resetForm(fresh);
                    }, 50);
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
    </ScrollView>
  );
};

export default SummaryPage;
