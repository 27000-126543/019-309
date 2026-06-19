import React, { useState, useMemo } from 'react';
import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockIncidents } from '@/data/mockSentiment';
import {
  Incident,
  AssigneeDept,
  DEPT_LABELS,
  URGENCY_LABELS,
  CATEGORY_LABELS
} from '@/types/sentiment';

interface FormState {
  factStatement: string;
  publicStatement: string;
  noResponseBoundary: string;
}

const CollaboratePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [selectedId, setSelectedId] = useState<string>(mockIncidents[0].id);
  const [selectedDepts, setSelectedDepts] = useState<AssigneeDept[]>([]);
  const [form, setForm] = useState<FormState>({
    factStatement: '',
    publicStatement: '',
    noResponseBoundary: ''
  });

  const pendingIncidents = useMemo(() => {
    return incidents.filter((i) => i.status !== 'closed');
  }, [incidents]);

  const currentIncident = useMemo(() => {
    return incidents.find((i) => i.id === selectedId) || pendingIncidents[0];
  }, [incidents, selectedId, pendingIncidents]);

  const urgencyClassMap: Record<string, string> = {
    critical: styles.urgencyCritical,
    high: styles.urgencyHigh,
    medium: styles.urgencyMedium,
    low: styles.urgencyLow
  };

  const toggleDept = (dept: AssigneeDept) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const deptInfo: { key: AssigneeDept; icon: string; iconClass: string; desc: string }[] = [
    { key: 'legal', icon: '法', iconClass: styles.deptIconLegal, desc: '合规审核' },
    { key: 'business', icon: '业', iconClass: styles.deptIconBusiness, desc: '事实核实' },
    { key: 'secretary', icon: '秘', iconClass: styles.deptIconSecretary, desc: '信披指导' }
  ];

  const canSubmit = selectedDepts.length > 0 && form.factStatement.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      Taro.showToast({ title: '请选择部门并填写事实说明', icon: 'none' });
      return;
    }

    const updated = incidents.map((i) =>
      i.id === selectedId
        ? {
            ...i,
            assignees: [...new Set([...i.assignees, ...selectedDepts])],
            status: 'assigned' as const,
            factStatement: i.factStatement || form.factStatement,
            publicStatement: i.publicStatement || form.publicStatement,
            noResponseBoundary: i.noResponseBoundary || form.noResponseBoundary
          }
        : i
    );
    setIncidents(updated);
    setSelectedDepts([]);
    setForm({ factStatement: '', publicStatement: '', noResponseBoundary: '' });

    Taro.showToast({ title: '派单成功，已通知相关部门', icon: 'success' });
    console.log('[Collaborate] 派单提交:', { incidentId: selectedId, depts: selectedDepts, form });
  };

  const handleIncidentChange = (id: string) => {
    setSelectedId(id);
    const inc = incidents.find((i) => i.id === id);
    if (inc) {
      setSelectedDepts([...inc.assignees]);
      setForm({
        factStatement: inc.factStatement,
        publicStatement: inc.publicStatement,
        noResponseBoundary: inc.noResponseBoundary
      });
    }
  };

  return (
    <ScrollView scrollY className={styles.page} enhanced showScrollbar={false}>
      <View className={styles.incidentSelector}>
        <Text className={styles.selectorLabel}>选择待处理事项</Text>
        <ScrollView scrollX className={styles.selectorRow} enhanced showScrollbar={false}>
          {pendingIncidents.map((inc) => (
            <Button
              key={inc.id}
              className={classnames(
                styles.selectorItem,
                selectedId === inc.id && styles.selectorItemActive
              )}
              onClick={() => handleIncidentChange(inc.id)}
            >
              <View className={classnames(styles.selectorUrgency, urgencyClassMap[inc.urgency])} />
              {URGENCY_LABELS[inc.urgency]} · {CATEGORY_LABELS[inc.category]}
            </Button>
          ))}
        </ScrollView>
      </View>

      <View className={styles.contentArea}>
        {currentIncident && (
          <>
            <View className={styles.incidentSummary}>
              <Text className={styles.summaryTitle}>{currentIncident.title}</Text>
              <View className={styles.summaryMeta}>
                <View className={styles.metaTag}>
                  {URGENCY_LABELS[currentIncident.urgency]}
                </View>
                <View className={styles.metaTag} style={{ background: 'rgba(245,63,63,0.08)', color: '#F53F3F' }}>
                  {CATEGORY_LABELS[currentIncident.category]}
                </View>
                <View className={styles.metaTag} style={{ background: 'rgba(134,144,156,0.08)', color: '#86909C' }}>
                  热度 {currentIncident.heat.toLocaleString()}
                </View>
              </View>
              <Text className={styles.summaryDesc}>{currentIncident.summary}</Text>
            </View>

            <View className={styles.assigneeSection}>
              <View className={styles.sectionTitle}>
                <Text>分派部门（多选）</Text>
                <Text className={styles.sectionTip}>点击切换选中状态</Text>
              </View>

              <View className={styles.deptGrid}>
                {deptInfo.map((d) => (
                  <Button
                    key={d.key}
                    className={classnames(
                      styles.deptCard,
                      selectedDepts.includes(d.key) && styles.deptCardActive
                    )}
                    onClick={() => toggleDept(d.key)}
                  >
                    <View className={classnames(styles.deptIcon, d.iconClass)}>{d.icon}</View>
                    <Text className={styles.deptName}>{DEPT_LABELS[d.key]}</Text>
                    <Text className={styles.deptDesc}>{d.desc}</Text>
                  </Button>
                ))}
              </View>

              {selectedDepts.length > 0 && (
                <View className={styles.selectedHint}>
                  ✓ 已选择 {selectedDepts.length} 个部门：{selectedDepts.map((d) => DEPT_LABELS[d]).join('、')}
                </View>
              )}
            </View>

            <View className={styles.formSection}>
              <View className={styles.sectionTitle}>
                <Text>协同填报</Text>
                <Text className={styles.sectionTip}>接收人填写以下三栏</Text>
              </View>

              <View className={styles.formBlock}>
                <View className={styles.formHeader}>
                  <View className={classnames(styles.formBadge, styles.badgeFact)}>1</View>
                  <View className={styles.formLabel}>
                    <Text className={styles.formLabelTitle}>事实说明</Text>
                    <Text className={styles.formLabelHint}>
                      仅用于内部同步，描述已核实的客观事实、时间线、涉及人员等
                    </Text>
                  </View>
                </View>
                <Textarea
                  className={styles.textarea}
                  value={form.factStatement}
                  placeholder="例：经核实，相关事项发生于X月X日，涉及XX产品批次。目前公司已启动XX流程，负责人为XXX……"
                  onInput={(e) => setForm({ ...form, factStatement: e.detail.value })}
                  maxlength={2000}
                  autoHeight
                />
              </View>

              <View className={styles.formBlock}>
                <View className={styles.formHeader}>
                  <View className={classnames(styles.formBadge, styles.badgePublic)}>2</View>
                  <View className={styles.formLabel}>
                    <Text className={styles.formLabelTitle}>可公开口径</Text>
                    <Text className={styles.formLabelHint}>
                      法务审定后的对外统一回复版本，可直接作为媒体/投资者问答使用
                    </Text>
                  </View>
                </View>
                <Textarea
                  className={classnames(styles.textarea, styles.textareaPublic)}
                  value={form.publicStatement}
                  placeholder="例：针对近期关于XX的报道，我司高度重视。经核查……感谢社会各界监督。"
                  onInput={(e) => setForm({ ...form, publicStatement: e.detail.value })}
                  maxlength={1500}
                  autoHeight
                />
              </View>

              <View className={styles.formBlock}>
                <View className={styles.formHeader}>
                  <View className={classnames(styles.formBadge, styles.badgeBoundary)}>3</View>
                  <View className={styles.formLabel}>
                    <Text className={styles.formLabelTitle}>不能回应的边界</Text>
                    <Text className={styles.formLabelHint}>
                      明确列出严禁对外透露的内容，包括敏感信息、未披露数据、个人隐私等
                    </Text>
                  </View>
                </View>
                <Textarea
                  className={classnames(styles.textarea, styles.textareaBoundary)}
                  placeholder="例：1. 不公开客户个人信息；2. 不回应过度延伸指责；3. 不披露具体和解金额……"
                  value={form.noResponseBoundary}
                  onInput={(e) => setForm({ ...form, noResponseBoundary: e.detail.value })}
                  maxlength={1000}
                  autoHeight
                />
              </View>
            </View>

            {currentIncident.assignees.length > 0 && (
              <View className={styles.historySection}>
                <Text className={styles.historyTitle}>历史派单记录</Text>
                {currentIncident.assignees.map((dept) => (
                  <View key={dept} className={styles.historyCard}>
                    <View className={styles.historyHead}>
                      <Text className={styles.historyDept}>
                        {DEPT_LABELS[dept]} · 已接收
                      </Text>
                      <Text className={styles.historyTime}>2小时前</Text>
                    </View>
                    <Text className={styles.historyContent}>
                      正在核实相关事实，预计30分钟内反馈。已同步至部门负责人。
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      <View className={styles.footerBar}>
        <Button className={styles.btnSecondary} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
          返回值班本
        </Button>
        <Button
          className={classnames(styles.btnPrimary, !canSubmit && styles.btnPrimaryDisabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          确认派单
        </Button>
      </View>
    </ScrollView>
  );
};

export default CollaboratePage;
