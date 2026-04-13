import styles from "./StatCard.module.css";

interface StatItem {
  icon: string;
  value: number;
  label: string;
  colorClass: string;
}

interface StatCardsProps {
  stats: StatItem[];
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className={styles.grid}>
      {stats.map((stat, i) => (
        <div key={i} className={styles.card}>
          <div className={`${styles.iconWrap} ${styles[stat.colorClass]}`}>
            {stat.icon}
          </div>
          <div className={styles.info}>
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
