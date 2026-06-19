import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { TrendPoint } from '@/types/sentiment';

interface TrendChartProps {
  points: TrendPoint[];
  currentHeat: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ points, currentHeat }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(points.length - 1);

  const maxValue = Math.max(...points.map((p) => p.value), 1000);
  const chartWidth = 100;
  const chartHeight = 220;
  const padding = 12;

  const xScale = (idx: number) =>
    padding + (idx / Math.max(points.length - 1, 1)) * (chartWidth - padding * 2);

  const yScale = (value: number) =>
    padding + (1 - value / maxValue) * (chartHeight - padding * 2);

  const linePoints = points.map((p, i) => `${xScale(i)},${yScale(p.value)}`).join(' ');

  const areaPoints = `${padding},${chartHeight - padding} ${linePoints} ${xScale(
    points.length - 1
  )},${chartHeight - padding}`;

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxValue * t / 100) * 100);

  const formatHeat = (v: number) => {
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    return v.toLocaleString();
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>传播热度曲线</Text>
        <View className={styles.heatBadge}>
          <Text>当前 </Text>
          <Text style={{ fontWeight: '700' }}>{formatHeat(currentHeat)}</Text>
        </View>
      </View>

      <View className={styles.chartArea}>
        <View className={styles.gridLines}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} className={styles.gridLine} />
          ))}
        </View>

        <View className={styles.yAxisLabels}>
          {yLabels
            .slice()
            .reverse()
            .map((v, i) => (
              <Text key={i} className={styles.yLabel}>
                {formatHeat(v)}
              </Text>
            ))}
        </View>

        <View className={styles.chartCanvas}>
          <svg className={styles.svgRoot} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <defs>
              <linearGradient id="heatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F53F3F" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F53F3F" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon className={styles.areaPath} points={areaPoints} />
            <polyline className={styles.linePath} points={linePoints} />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(p.value)}
                className={i === activeIdx ? styles.pointCircleActive : styles.pointCircle}
                r={i === activeIdx ? 5 : 3.5}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </svg>

          {activeIdx !== null && (
            <View
              className={styles.tooltip}
              style={{
                left: `${xScale(activeIdx) / chartWidth * 100}%`,
                top: `${(yScale(points[activeIdx].value) - padding) / (chartHeight - padding * 2) * 85}%`
              }}
            >
              {points[activeIdx].time} · {points[activeIdx].value.toLocaleString()}
            </View>
          )}
        </View>
      </View>

      <View className={styles.xAxisLabels}>
        {points.map((p, i) => (
          <Text key={i} className={styles.xLabel}>
            {p.time}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default TrendChart;
