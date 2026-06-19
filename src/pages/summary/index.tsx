import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockIncidents, mockSyncTemplates } from '@/data/mockSentiment';
import { Incident, SyncTemplate, URGENCY_LABELS } from '@/types/sentiment';

const TIME_OPTIONS = [
  { key: '30m', label: '30分钟后', minutes: 30 },
  { key: '1h', label: '1小时后', minutes: 60 },
  { key: '2h', label: '2小时后（下午盘前）', minutes: 120 },
  { key: '4h', label: '4小时后（收盘后）', minutes: 240 },
  { key: '1d', label: '明天同一时间', minutes: 1440 }
];

const urgencyColorMap: Record<string, string> = {
  critical: '#F53F3F',
  high: '#FF7D00',
  medium: '#FFAA00',
  low: '#00B42A'
};

const SummaryPage: React.FC = () => {
  const [incidents] = useState<Incident[]>(mockIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    mockSyncTemplates.length > 0 ? null : null
  );
  const [showPicker, setShowPicker] = useState(false);

  const [progress, setProgress] = useState('');
  const [actions, setActions] = useState<string[]>(['', '']);
  const [selectedTimeKey, setSelectedTimeKey] = useState<string>('1h');
  const [customTime, setCustomTime] = useState('');
  const [templates, setTemplates] = useState<SyncTemplate[]>(mockSyncTemplates);

  useDidShow(() => {
    if (templates.length > 0 && !selectedIncidentId && progress === '') {
      const latest = templates[0];
      setSelectedIncidentId(latest.incidentId);
      setProgress(latest.progress);
      setActions(latest.suggestedActions.length > 0 ? latest.suggestedActions : ['', '']);
    }
  });

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) || null,
    [incidents, selectedIncidentId]
  );

  const nextCheckTime = useMemo(() => {
    if (customTime.trim()) return customTime;
    const opt = TIME_OPTIONS.find((o) => o.key === selectedTimeKey);
    if (!opt) return '1小时后';
    const date = new Date(Date.now() + opt.minutes * 60 * 1000);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, [selectedTimeKey, customTime]);

  const generateContent = () => {
    const lines: string[] = [];
    lines.push('【舆情对内同步】');
    lines.push('');
    if (selectedIncident) {
      lines.push(`事项：${selectedIncident.title}`);
      lines.push(`紧急等级：${URGENCY_LABELS[selectedIncident.urgency]} | 当前热度：${selectedIncident.heat.toLocaleString()}`);
      lines.push('');
    }
    lines.push('一、事情进展：');
    lines.push(progress || '（待填写）');
    lines.push('');
    const validActions = actions.filter((a) => a.trim());
    lines.push('二、建议动作：');
    if (validActions.length > 0) {
      validActions.forEach((a, i) => lines.push(`  ${i + 1}. ${a}`));
    } else {
      lines.push('  （待填写）');
    }
    lines.push('');
    lines.push(`三、下一次观察时间：${nextCheckTime}`);
    lines.push('');
    lines.push(`——品牌公关部 ${new Date().toLocaleDateString('zh-CN')}`);
    return lines.join('\n');
  };

  const templateContent = useMemo(() => generateContent(), [selectedIncident, progress, actions, nextCheckTime]);

  const addAction = () => setActions([...actions, '']);

  const updateAction = (idx: number, value: string) => {
    const next = [...actions];
    next[idx] = value;
    setActions(next);
  };

  const removeAction = (idx: number) => {
    if (actions.length <= 1) return;
    setActions(actions.filter((_, i) => i !== idx));
  };

  const canCopy = progress.trim().length > 0 || actions.some((a) => a.trim());

  const handleCopy = () => {
    if (!canCopy) {
      Taro.showToast({ title: '请先填写进展或建议动作', icon: 'none' });
      return;
    }
    Taro.setClipboardData({
      data: templateContent,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
    console.log('[Summary] 复制同步模板:', templateContent);
  };

  const handleSave = () => {
    if (!canCopy || !selectedIncident) {
      Taro.showToast({ title: '请完善内容后再保存', icon: 'none' });
      return;
    }
    const newTpl: SyncTemplate = {
      id: `SYNC-${String(templates.length + 1).padStart(3, '0')}`,
      incidentId: selectedIncident.id,
      incidentTitle: selectedIncident.title,
      generatedAt: new Date().toISOString(),
      progress,
      suggestedActions: actions.filter((a) => a.trim()),
      nextCheckTime,
      content: templateContent
    };
    setTemplates([newTpl, ...templates]);
    Taro.showToast({ title: '已保存至历史记录', icon: 'success' });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView scrollY className={styles.page} enhanced showScrollbar={false}>
      <View className={styles.incidentPicker}>
        <Text className={styles.pickerLabel}>选择需同步的事项</Text>
        <Button className={styles.pickerBtn} onClick={() => setShowPicker(true)}>
          {selectedIncident ? (
            <Text className={styles.pickerTitle}>{selectedIncident.title}</Text>
          ) : (
            <Text className={styles.pickerEmpty}>点击选择事项（可选）</Text>
          )}
          <Text className={styles.pickerArrow}>›</Text>
        </Button>
      </View>

      <View className={styles.content}>
        <View className={styles.formCard}>
          <View className={styles.cardTitle}>
            <View className={styles.cardBadge}>1</View>
            <Text>事情进展</Text>
          </View>
          <Text className={styles.fieldLabel}>目前进展描述</Text>
          <Text className={styles.fieldHint}>
            客观陈述已核实的事实、已采取的动作、各部门反馈情况，不要加入主观判断
          </Text>
          <Textarea
            className={styles.textarea}
            value={progress}
            placeholder="例：经核实，XX事项属实/部分属实/不属实。法务部已完成XX，业务部门正在XX，预计XX时间有进一步结果。"
            onInput={(e) => setProgress(e.detail.value)}
            maxlength={2000}
            autoHeight
          />
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardTitle}>
            <View className={styles.cardBadge}>2</View>
            <Text>建议动作</Text>
          </View>
          <Text className={styles.fieldLabel}>后续需执行的动作清单</Text>
          <Text className={styles.fieldHint}>每条动作包含：具体事项 + 责任人/部门 + 时间节点</Text>

          <View className={styles.actionList}>
            {actions.map((act, i) => (
              <View key={i} className={styles.actionItem}>
                <View className={styles.actionIndex}>{i + 1}</View>
                <Input
                  className={styles.actionInput}
                  value={act}
                  placeholder={`动作${i + 1}：如 14:00前 在官方微博发布声明`}
                  onInput={(e) => updateAction(i, e.detail.value)}
                />
                {actions.length > 1 && (
                  <Button className={styles.actionRemove} onClick={() => removeAction(i)}>
                    ×
                  </Button>
                )}
              </View>
            ))}
          </View>

          <Button className={styles.addActionBtn} onClick={addAction}>
            + 添加一条动作
          </Button>
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardTitle}>
            <View className={styles.cardBadge}>3</View>
            <Text>下一次观察时间</Text>
          </View>
          <View className={styles.timeSection}>
            <View className={styles.timeOptions}>
              {TIME_OPTIONS.map((opt) => (
                <Button
                  key={opt.key}
                  className={classnames(
                    styles.timeOpt,
                    selectedTimeKey === opt.key && !customTime && styles.timeOptActive
                  )}
                  onClick={() => {
                    setSelectedTimeKey(opt.key);
                    setCustomTime('');
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </View>
            <Text className={styles.fieldLabel} style={{ marginTop: '8rpx' }}>
              或自定义时间：
            </Text>
            <Input
              className={styles.customTime}
              value={customTime}
              placeholder="例：6月19日 15:00（收盘复盘）"
              onInput={(e) => setCustomTime(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.previewCard}>
          <View className={styles.previewHeader}>
            <View className={styles.previewTitleBlock}>
              <View className={styles.previewTag}>对内同步 · 实时预览</View>
              <Text className={styles.previewMainTitle}>
                {selectedIncident ? selectedIncident.title : '（未关联具体事项）'}
              </Text>
            </View>
            <Text className={styles.previewTime}>{formatDateTime(new Date().toISOString())}</Text>
          </View>

          <View className={styles.previewSection}>
            <Text className={styles.previewSectionTitle}>事情进展</Text>
            <Text className={styles.previewText}>
              {progress || '（请在上方填写当前进展情况）'}
            </Text>
          </View>

          <View className={styles.previewSection}>
            <Text className={styles.previewSectionTitle}>建议动作</Text>
            {actions.filter((a) => a.trim()).length > 0 ? (
              actions
                .filter((a) => a.trim())
                .map((a, i) => (
                  <View key={i} className={styles.previewActionItem}>
                    <View className={styles.previewActionNum}>{i + 1}</View>
                    <Text className={styles.previewActionText}>{a}</Text>
                  </View>
                ))
            ) : (
              <Text className={styles.previewText} style={{ color: '#86909C' }}>
                （请在上方填写建议动作）
              </Text>
            )}
          </View>

          <View className={styles.previewSection}>
            <Text className={styles.previewSectionTitle}>下一次观察时间</Text>
            <View className={styles.previewHighlight}>⏰ {nextCheckTime}</View>
          </View>

          <View className={styles.previewFooter}>
            <Text className={styles.previewSender}>—— 品牌公关部值班组</Text>
            <Text className={styles.previewSender}>仅内部同步，请勿外传</Text>
          </View>
        </View>

        <View className={styles.historySection}>
          <View className={styles.historyTitle}>
            <Text>历史同步记录</Text>
            <Text className={styles.historyCount}>共 {templates.length} 条</Text>
          </View>
          {templates.length > 0 ? (
            templates.map((t) => (
              <View key={t.id} className={styles.historyCard}>
                <View className={styles.historyHead}>
                  <Text className={styles.historyTitleText}>{t.incidentTitle}</Text>
                  <Text className={styles.historyTime}>{formatDateTime(t.generatedAt)}</Text>
                </View>
                <Text className={styles.historyPreview}>{t.progress}</Text>
                <View className={styles.historyMeta}>
                  <View className={styles.historyMetaTag}>
                    {t.suggestedActions.length} 项动作
                  </View>
                  <View className={styles.historyMetaTag}>下次观察 {formatDateTime(t.nextCheckTime)}</View>
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyHint}>暂无历史记录{'\n'}填写完成后保存即可出现在此处</View>
          )}
        </View>
      </View>

      <View className={styles.copyBar}>
        <Button className={styles.btnSecondary} onClick={handleSave}>
          保存记录
        </Button>
        <Button className={styles.btnPrimary} onClick={handleCopy}>
          复制同步文案
        </Button>
      </View>

      {showPicker && (
        <>
          <View className={styles.pickerMask} onClick={() => setShowPicker(false)} />
          <View className={styles.pickerSheet}>
            <View className={styles.pickerSheetHeader}>
              <Text className={styles.pickerSheetTitle}>选择事项</Text>
              <Button className={styles.pickerClose} onClick={() => setShowPicker(false)}>
                关闭
              </Button>
            </View>
            <ScrollView scrollY className={styles.pickerSheetList}>
              <Button
                className={classnames(
                  styles.pickerSheetItem,
                  !selectedIncidentId && styles.pickerSheetItemActive
                )}
                onClick={() => {
                  setSelectedIncidentId(null);
                  setShowPicker(false);
                }}
              >
                <View className={styles.sheetUrgency} style={{ background: '#C9CDD4' }} />
                <Text className={styles.sheetTitle}>不关联具体事项（通用模板）</Text>
              </Button>
              {incidents.map((inc) => (
                <Button
                  key={inc.id}
                  className={classnames(
                    styles.pickerSheetItem,
                    selectedIncidentId === inc.id && styles.pickerSheetItemActive
                  )}
                  onClick={() => {
                    setSelectedIncidentId(inc.id);
                    if (inc.factStatement) setProgress(inc.factStatement);
                    setShowPicker(false);
                  }}
                >
                  <View
                    className={styles.sheetUrgency}
                    style={{ background: urgencyColorMap[inc.urgency] }}
                  />
                  <Text className={styles.sheetTitle}>
                    {URGENCY_LABELS[inc.urgency]} · {inc.title}
                  </Text>
                </Button>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default SummaryPage;
