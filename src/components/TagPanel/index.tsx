import React from 'react';
import { View, Text, Button, Textarea } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { JudgeTag, JUDGE_LABELS } from '@/types/sentiment';

interface TagPanelProps {
  value: JudgeTag | null;
  note: string;
  onChange?: (tag: JudgeTag | null) => void;
  onNoteChange?: (note: string) => void;
  readOnly?: boolean;
}

const TAG_DESCRIPTIONS: Record<JudgeTag, string> = {
  pending: '事实层面存在，等待进一步核实细节',
  exaggerate: '有事实基础，但存在放大或断章取义',
  oldnews: '往期已处理事项，重新翻炒无新意',
  malicious: '无任何事实依据，纯属捏造诽谤'
};

const TagPanel: React.FC<TagPanelProps> = ({ value, note, onChange, onNoteChange, readOnly }) => {
  const tags: JudgeTag[] = ['pending', 'exaggerate', 'oldnews', 'malicious'];

  const colorMap: Record<JudgeTag, { btn: string; label: string }> = {
    pending: { btn: styles.tagPending, label: styles.tagLabelPending },
    exaggerate: { btn: styles.tagExaggerate, label: styles.tagLabelExaggerate },
    oldnews: { btn: styles.tagOldnews, label: styles.tagLabelOldnews },
    malicious: { btn: styles.tagMalicious, label: styles.tagLabelMalicious }
  };

  return (
    <View className={styles.panel}>
      <Text className={styles.title}>初判标签</Text>

      <View className={styles.tagGrid}>
        {tags.map((tag) => (
          <Button
            key={tag}
            className={classnames(
              styles.tagBtn,
              value === tag && styles.tagBtnActive,
              colorMap[tag].btn
            )}
            onClick={() => !readOnly && onChange?.(value === tag ? null : tag)}
          >
            <Text className={classnames(styles.tagLabel, colorMap[tag].label)}>
              {JUDGE_LABELS[tag]}
            </Text>
            <Text className={styles.tagDesc}>{TAG_DESCRIPTIONS[tag]}</Text>
          </Button>
        ))}
      </View>

      {!readOnly && (
        <>
          <Text className={styles.noteLabel}>初判说明（可选，用于对内同步）</Text>
          <Textarea
            className={styles.noteArea}
            value={note}
            placeholder="例如：已核实来源、已联系当事人、待财务核对等"
            onInput={(e) => onNoteChange?.(e.detail.value)}
            maxlength={500}
          />
        </>
      )}
      {readOnly && note && (
        <View>
          <Text className={styles.noteLabel}>初判说明</Text>
          <Text style={{ fontSize: '28rpx', color: '#4E5969', lineHeight: 1.6 }}>{note}</Text>
        </View>
      )}
    </View>
  );
};

export default TagPanel;
