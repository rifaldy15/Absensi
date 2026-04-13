"use client";

import styles from "./Charts.module.css";

interface VendorData {
  name: string;
  count: number;
  color: string;
}

interface OpsData {
  name: string;
  count: number;
}

interface VendorChartProps {
  data: VendorData[];
}

interface OpsChartProps {
  data: OpsData[];
}

export function VendorDonutChart({ data }: VendorChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Build conic gradient
  let gradientStops = "";
  let currentAngle = 0;
  data.forEach((d, i) => {
    const angle = (d.count / total) * 360;
    gradientStops += `${d.color} ${currentAngle}deg ${currentAngle + angle}deg`;
    if (i < data.length - 1) gradientStops += ", ";
    currentAngle += angle;
  });

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>🍩 Distribusi Vendor</div>
      <div className={styles.donutWrap}>
        <div
          className={styles.donut}
          style={{
            background: `conic-gradient(${gradientStops})`,
            WebkitMask: "radial-gradient(circle, transparent 42%, black 43%)",
            mask: "radial-gradient(circle, transparent 42%, black 43%)",
          }}>
          <div className={styles.donutCenter}>
            <div className={styles.donutValue}>{total}</div>
            <div className={styles.donutLabel}>Pekerja</div>
          </div>
        </div>
        <div className={styles.legend}>
          {data.map((d) => (
            <div key={d.name} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: d.color }}
              />
              <span className={styles.legendName}>{d.name}</span>
              <span className={styles.legendCount}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OpsBarChart({ data }: OpsChartProps) {
  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>📊 Per Ops Unit</div>
      <div className={styles.bars}>
        {data.map((d) => (
          <div key={d.name} className={styles.barRow}>
            <span className={styles.barLabel}>{d.name}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(d.count / max) * 100}%` }}>
                {d.count}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
