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
  JUDGE_LABELS,
  DEPT_LABELS,
  CATEGORY_TEMPLATES,
  getAdaptiveRhythm,
  AssigneeDept,
  DeptFeedbackStatus
} from '@/types/sentiment';

const DEPT_ORDER: AssigneeDept[] = ['legal', 'business', 'secretary'];

const SummaryPage: React.FC = () => {
  const incidents = useSentimentStore((s) => s.incidents);
  const currentIncidentId = useSentimentStore((s) => s.currentIncidentId);
  const syncTemplates = useSentimentStore((s) => s.syncTemplates);
  const getMergedFeedback = useSentimentStore((s) => s.getMergedFeedback);
  const buildSyncSnapshot = useSentimentStore((s) => s.buildSyncSnapshot);
  const addSyncTemplate = useSentimentStore((s) => s.addSyncTemplate);
  const setCurrentIncidentId = useSentimentStore((s) => s.setCurrentIncidentId);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [progressText, setProgressText] = useState<string>('');
  const [actions, setActions] = useState<string[]>([]);
  const [nextCheckTime, setNextCheckTime] = useState<string>('');
  const [detailTpl, setDetailTpl] = useState<SyncTemplate | null>(null);

  const activeId = currentIncidentId || incidents[0]?.id || '';

  const incident: Incident | undefined = useMemo(
    () => incidents.find((i) => i.id === activeId),
    [incidents, activeId]
  );

  const category: IncidentCategory = incident?.category || 'media';
  const tplConfig = CATEGORY_TEMPLATES[category];
  const rhythm = useMemo(() => {
    if (!incident) return { checkMinutes: 60, label: '每60分钟', extraActions: [] };
    return getAdaptiveRhythm(incident.category, incident.urgency, incident.heat);
  }, [incident]);

  const resetForm = (inc: Incident) => {
    const merged = getMergedFeedback(inc);
    const factsParts = [merged.factStatement, merged.publicStatement]
      .filter(Boolean)
      .map((s) => s.replace(/\n+/g, ' ').slice(0, 80))
      .join(' ');

    const heatInfo = `当前热度 ${inc.heat.toLocaleString()}，${inc.heatTrend === 'rising' ? '↑ 升温' : inc.heatTrend === 'falling' ? '↓ 降温' : '→ 平稳'}`;
    const judgeInfo = inc.judgeTag ? `初判：${JUDGE_LABELS[inc.judgeTag]}` : '尚无初判';
    const deptInfo = DEPT_ORDER
      .filter((d) => inc.feedbacks[d]?.status === 'submitted')
      .map((d) => DEPT_LABELS[d])
      .join('、');
    const deptLine = deptInfo ? `已反馈部门：${deptInfo}` : '尚无部门反馈';

    const defaultProgress = factsParts
      ? `${heatInfo}。${judgeInfo}。${deptLine}。${factsParts}。${tplConfig.progressTemplate}`
      : `${heatInfo}。${judgeInfo}。${deptLine}。${tplConfig.progressTemplate}`;

    setProgressText(defaultProgress);
    setActions([...tplConfig.suggestedActions, ...rhythm.extraActions]);

    const defaultNext = new Date(Date.now() + rhythm.checkMinutes * 60 * 1000);
    const nextStr = `${defaultNext.getMonth() + 1}月${defaultNext.getDate()}日 ${String(defaultNext.getHours()).padStart(2, '0')}:${String(defaultNext.getMinutes()).padStart(2, '0')}`;
    setNextCheckTime(nextStr);
  };

  useDidShow(() => {
    const fresh = incidents.find((i) => i.id === activeId);
    if (fresh) resetForm(fresh);
    console.log('[Summary] 页面展示，当前事项:', activeId, '模板条数:', syncTemplates.length);
  });

  useEffect(() => {
    if (incident && !progressText) resetForm(incident);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, incident?.id]);

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
    setActions(actions.filter((_, i) => i !== idx));
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
    const snapshot = buildSyncSnapshot(incident);
    addSyncTemplate({
      incidentId: incident.id,
      incidentTitle: incident.title,
      incidentCategory: incident.category,
      progressText: progressText.trim(),
      suggestedActions: actions.filter((a) => a.trim()),
      nextCheckTime: nextCheckTime.trim() || '待确认',
      factStatement: snapshot.snapshotFactStatement,
      publicStatement: snapshot.snapshotPublicStatement,
      noResponseBoundary: snapshot.snapshotNoResponseBoundary,
      content: '',
      snapshotHeat: snapshot.snapshotHeat,
      snapshotJudgeTag: snapshot.snapshotJudgeTag,
      snapshotJudgeNote: snapshot.snapshotJudgeNote,
      snapshotDeptStatus: snapshot.snapshotDeptStatus,
      snapshotFactStatement: snapshot.snapshotFactStatement,
      snapshotPublicStatement: snapshot.snapshotPublicStatement,
      snapshotNoResponseBoundary: snapshot.snapshotNoResponseBoundary,
      adaptiveCheckMinutes: snapshot.adaptiveCheckMinutes
    });
    Taro.showToast({ title: '同步模板已生成', icon: 'success' });
  };

  const handleReuse = (tpl: SyncTemplate) => {
    setCurrentIncidentId(tpl.incidentId);
    setProgressText(tpl.progress);
    setActions([...tpl.suggestedActions]);
    setNextCheckTime(tpl.nextCheckTime);
    setDetailTpl(null);
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

  const historyAll = syncTemplates;

  const groupedHistory = useMemo(() => {
    const groups: Record<string, SyncTemplate[]> = {};
    historyAll.forEach((tpl) => {
      if (!groups[tpl.incidentId]) groups[tpl.incidentId] = [];
      groups[tpl.incidentId].push(tpl);
    });
    Object.keys(groups).forEach((incidentId) => {
      groups[incidentId].sort((a, b) => b.version - a.version);
    });
    return groups;
  }, [historyAll]);

  const groupedList = useMemo(() => {
    return Object.entries(groupedHistory).map(([incidentId, tpls]) => {
      const inc = incidents.find((i) => i.id === incidentId);
      return {
        incidentId,
        incidentTitle: inc?.title || tpls[0].incidentTitle,
        templates: tpls
      };
    });
  }, [groupedHistory, incidents]);

  const renderDeptStatusTags = (deptStatus: Record<AssigneeDept, DeptFeedbackStatus | null>) => {
    return DEPT_ORDER.map((d) => {
      const s = deptStatus[d];
      if (!s) return null;
      const label = s === 'submitted' ? '✓ 已反馈' : s === 'in_progress' ? '··· 处理中' : s === 'rejected' ? '! 需补充' : '待处理';
      return (
        <View key={d} className={styles.historyTag}>
          {DEPT_LABELS[d]}：{label}
        </View>
      );
    });
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
            已根据「{CATEGORY_LABELS[incident.category]}」+「{URGENCY_LABELS[incident.urgency]}」+ 热度 {incident.heat.toLocaleString()} 推荐观察节奏：{rhythm.label}
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
              已预置 {tplConfig.suggestedActions.length} 条场景化建议 + {rhythm.extraActions.length} 条节奏建议，可自由增删
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
            自适应推荐 {rhythm.checkMinutes} 分钟后观察（{rhythm.label}）
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
            <Text>📚 历史同步记录（按事项归档）</Text>
          </View>
          <View className={styles.historyCount}>{historyAll.length} 条 · {groupedList.length} 个事项</View>
        </View>
        {historyAll.length === 0 ? (
          <View className={styles.emptyTip}>暂无历史同步记录，保存后可在此复用</View>
        ) : (
          <View className={styles.historyGroups}>
            {groupedList.map((group) => (
              <View key={group.incidentId} className={styles.historyGroup}>
                <View className={styles.historyGroupHeader}>
                  <Text className={styles.historyGroupTitle} numberOfLines={1}>
                    {group.incidentTitle}
                  </Text>
                  <View className={styles.historyGroupBadge}>
                    <Text className={styles.historyGroupBadgeText}>
                      共 {group.templates.length} 版
                    </Text>
                  </View>
                </View>

                {group.templates.map((tpl, idx) => (
                  <View key={tpl.id} className={classnames(styles.historyCard, idx === 0 && styles.historyCardLatest)}>
                    <View className={styles.historyHead}>
                      <View className={styles.historyHeadLeft}>
                        <View className={classnames(styles.versionBadge, idx === 0 && styles.versionBadgeLatest)}>
                          <Text className={styles.versionBadgeText}>v{tpl.version}</Text>
                        </View>
                        <Text className={styles.historyIncident} numberOfLines={1}>{tpl.incidentTitle}</Text>
                      </View>
                      <Text className={styles.historyTime}>{formatTime(tpl.generatedAt)}</Text>
                    </View>

                    {tpl.versionNote && (
                      <View className={styles.versionNote}>
                        <Text className={styles.versionNoteLabel}>版本说明：</Text>
                        <Text className={styles.versionNoteText}>{tpl.versionNote}</Text>
                      </View>
                    )}

                    <Text className={styles.historyPreview}>{tpl.progress}</Text>
                    <View className={styles.historyMeta}>
                      <View className={styles.historyMetaLeft}>
                        <View className={styles.historyTag}>{CATEGORY_LABELS[tpl.incidentCategory]}</View>
                        <View className={styles.historyTag}>{tpl.suggestedActions.length} 项动作</View>
                        <View className={styles.historyTag}>by {tpl.generatedBy}</View>
                        {tpl.snapshotHeat > 0 && (
                          <View className={styles.historyTag}>热度 {tpl.snapshotHeat.toLocaleString()}</View>
                        )}
                      </View>
                      <View style={{ display: 'flex', gap: '12rpx' }}>
                        <Button className={styles.reuseBtn} onClick={() => setDetailTpl(tpl)}>
                          详情
                        </Button>
                        <Button className={styles.reuseBtn} onClick={() => handleReuse(tpl)}>
                          复用此版
                        </Button>
                      </View>
                    </View>

                    {idx < group.templates.length - 1 && (
                      <View className={styles.versionConnector}>
                        <View className={styles.versionConnectorLine}></View>
                        <Text className={styles.versionConnectorText}>更新为 v{tpl.version - 1}</Text>
                        <View className={styles.versionConnectorLine}></View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
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
                  className={classnames(styles.modalItem, inc.id === activeId && styles.active)}
                  onClick={() => {
                    setCurrentIncidentId(inc.id);
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

      {detailTpl && (
        <View className={styles.modalMask} onClick={() => setDetailTpl(null)}>
          <View className={styles.modalSheet} onClick={(e) => e.stopPropagation && e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>同步记录详情</Text>
              <Text className={styles.modalClose} onClick={() => setDetailTpl(null)}>×</Text>
            </View>
            <ScrollView scrollY className={styles.modalList} enhanced showScrollbar={false}>
              <View style={{ padding: '24rpx 32rpx' }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx', marginBottom: '12rpx' }}>
                  <View style={{ background: '#007AFF', padding: '6rpx 16rpx', borderRadius: '8rpx' }}>
                    <Text style={{ fontSize: '24rpx', fontWeight: 600, color: '#fff' }}>v{detailTpl.version}</Text>
                  </View>
                  {detailTpl.previousId && (
                    <Text style={{ fontSize: '22rpx', color: '#86909C' }}>上一版: v{detailTpl.version - 1}</Text>
                  )}
                </View>

                <Text style={{ fontSize: '30rpx', fontWeight: 600, color: '#1D2129', marginBottom: '16rpx', display: 'block' }}>
                  {detailTpl.incidentTitle}
                </Text>

                {detailTpl.versionNote && (
                  <View style={{ background: '#F0F7FF', padding: '16rpx', borderRadius: '12rpx', marginBottom: '20rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#007AFF', fontWeight: 500, display: 'block', marginBottom: '4rpx' }}>
                      📝 版本说明
                    </Text>
                    <Text style={{ fontSize: '26rpx', color: '#1D2129', lineHeight: 1.6 }}>
                      {detailTpl.versionNote}
                    </Text>
                  </View>
                )}

                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8rpx', marginBottom: '20rpx' }}>
                  <View className={styles.historyTag}>{CATEGORY_LABELS[detailTpl.incidentCategory]}</View>
                  <View className={styles.historyTag}>热度 {detailTpl.snapshotHeat.toLocaleString()}</View>
                  {detailTpl.snapshotJudgeTag && (
                    <View className={styles.historyTag}>初判：{JUDGE_LABELS[detailTpl.snapshotJudgeTag]}</View>
                  )}
                  <View className={styles.historyTag}>{formatTime(detailTpl.generatedAt)}</View>
                </View>

                {detailTpl.snapshotJudgeNote && (
                  <View style={{ marginBottom: '20rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>初判说明：</Text>
                    <Text style={{ fontSize: '26rpx', color: '#4E5969', lineHeight: 1.6 }}>{detailTpl.snapshotJudgeNote}</Text>
                  </View>
                )}

                <View style={{ marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '8rpx' }}>部门反馈状态：</Text>
                  <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8rpx' }}>
                    {renderDeptStatusTags(detailTpl.snapshotDeptStatus)}
                  </View>
                </View>

                <View style={{ marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>📌 事项进展：</Text>
                  <Text style={{ fontSize: '26rpx', color: '#4E5969', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detailTpl.progress}</Text>
                </View>

                <View style={{ marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>🎯 建议动作：</Text>
                  {detailTpl.suggestedActions.map((a, i) => (
                    <Text key={i} style={{ fontSize: '26rpx', color: '#4E5969', lineHeight: 1.6, display: 'block' }}>
                      {i + 1}. {a}
                    </Text>
                  ))}
                </View>

                <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>
                  ⏰ 下次观察：{detailTpl.nextCheckTime}
                </Text>

                {detailTpl.snapshotFactStatement && (
                  <View style={{ marginTop: '20rpx', padding: '16rpx', background: '#F7F8FA', borderRadius: '12rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>引用的事实说明：</Text>
                    <Text style={{ fontSize: '24rpx', color: '#4E5969', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{detailTpl.snapshotFactStatement}</Text>
                  </View>
                )}

                {detailTpl.snapshotPublicStatement && (
                  <View style={{ marginTop: '12rpx', padding: '16rpx', background: '#F7F8FA', borderRadius: '12rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>引用的可公开口径：</Text>
                    <Text style={{ fontSize: '24rpx', color: '#4E5969', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{detailTpl.snapshotPublicStatement}</Text>
                  </View>
                )}

                {detailTpl.snapshotNoResponseBoundary && (
                  <View style={{ marginTop: '12rpx', padding: '16rpx', background: '#FFF7F0', borderRadius: '12rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', display: 'block', marginBottom: '4rpx' }}>回应边界：</Text>
                    <Text style={{ fontSize: '24rpx', color: '#4E5969', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{detailTpl.snapshotNoResponseBoundary}</Text>
                  </View>
                )}

                <View style={{ display: 'flex', gap: '16rpx', marginTop: '32rpx' }}>
                  <Button
                    className={styles.btnGhost}
                    style={{ flex: 1 }}
                    onClick={() => setDetailTpl(null)}
                  >
                    关闭
                  </Button>
                  <Button
                    className={styles.btnPrimary}
                    style={{ flex: 2 }}
                    onClick={() => handleReuse(detailTpl)}
                  >
                    复用此模板
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default SummaryPage;
