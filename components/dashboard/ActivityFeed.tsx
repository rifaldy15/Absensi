import styles from "./ActivityFeed.module.css";

export interface FeedItem {
  id: string;
  name: string;
  type: "check-out" | "check-in";
  time: string;
  vendor: string;
}

interface ActivityFeedProps {
  items: FeedItem[];
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>📋 Aktivitas Terkini</div>
      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>Belum ada aktivitas hari ini.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.item}>
              <span
                className={`${styles.dot} ${
                  item.type === "check-out" ? styles.dotOut : styles.dotIn
                }`}
              />
              <div className={styles.content}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.detail}>
                  {item.type === "check-out"
                    ? "Mulai istirahat"
                    : "Kembali bekerja"}{" "}
                  · {item.vendor}
                </div>
              </div>
              <span className={styles.time}>{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
