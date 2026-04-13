"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./scan.module.css";

type ScanState = "idle" | "check-out" | "check-in";

interface ScanLog {
  id: string;
  name: string;
  ops: string;
  type: ScanState;
  time: string;
  vendor: string;
}

interface ActiveBreak {
  workerId: string;
  checkOutTime: Date;
}

export default function ScanStationPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [scannedWorker, setScannedWorker] = useState<{
    name: string;
    ops: string;
    vendor: string;
  } | null>(null);
  const [breakDuration, setBreakDuration] = useState<string>("");
  const [overdueMinutes, setOverdueMinutes] = useState(0);
  const [scanLog, setScanLog] = useState<ScanLog[]>([]);
  const [activeBreaks, setActiveBreaks] = useState<Map<string, ActiveBreak>>(
    new Map(),
  );
  const [countdown, setCountdown] = useState(3600);
  const [autoCloseProgress, setAutoCloseProgress] = useState(100);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualError, setManualError] = useState("");
  const [loading, setLoading] = useState(false);

  const autoCloseRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial logs and active breaks on mount
  useEffect(() => {
    fetch("/api/scan")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeBreaks) {
          const breaksMap = new Map();
          data.activeBreaks.forEach((ab: any) => {
            breaksMap.set(ab.worker.ops, {
              workerId: ab.worker.ops,
              checkOutTime: new Date(ab.checkOutTime),
            });
          });
          setActiveBreaks(breaksMap);
        }
        if (data.logs) {
          setScanLog(
            data.logs.map((log: any) => ({
              id: log.id,
              name: log.worker.name,
              ops: log.worker.ops,
              type: log.type as ScanState,
              time: new Date(log.time).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              vendor: log.worker.vendor.name,
            })),
          );
        }
      })
      .catch(console.error);
  }, []);

  // Keep hidden input focused (only when manual input is not active)
  useEffect(() => {
    const focus = () => {
      if (!showManualInput) inputRef.current?.focus();
    };
    focus();
    window.addEventListener("click", focus);
    return () => window.removeEventListener("click", focus);
  }, [showManualInput]);

  // Focus manual input when opened
  useEffect(() => {
    if (showManualInput) {
      setTimeout(() => manualInputRef.current?.focus(), 100);
    }
  }, [showManualInput]);

  // Auto-close back to idle after 5 seconds
  const startAutoClose = useCallback(() => {
    let progress = 100;
    const startTime = Date.now();
    const duration = 5000;

    if (autoCloseRef.current) clearInterval(autoCloseRef.current);

    autoCloseRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      progress = Math.max(0, 100 - (elapsed / duration) * 100);
      setAutoCloseProgress(progress);

      if (elapsed >= duration) {
        if (autoCloseRef.current) clearInterval(autoCloseRef.current);
        setState("idle");
        setScannedWorker(null);
        setAutoCloseProgress(100);
        // Refocus hidden input immediately
        if (!showManualInput) inputRef.current?.focus();
      }
    }, 50);
  }, [showManualInput]);

  // Countdown timer for check-out state
  useEffect(() => {
    if (state === "check-out" && scannedWorker) {
      const breakInfo = activeBreaks.get(scannedWorker.ops);
      if (!breakInfo) return;

      countdownRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - breakInfo.checkOutTime.getTime()) / 1000,
        );
        const remaining = 3600 - elapsed;
        setCountdown(remaining);
      }, 1000);

      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [state, scannedWorker, activeBreaks]);

  const formatCountdown = (secs: number): string => {
    const absSecs = Math.abs(secs);
    const m = Math.floor(absSecs / 60);
    const s = absSecs % 60;
    const sign = secs < 0 ? "-" : "";
    return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const processScan = async (query: string) => {
    if (loading) return;
    setLoading(true);
    setManualError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opsId: query.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setManualError(data.error || "Pekerja tidak ditemukan");
        setLoading(false);
        return;
      }

      const workerInfo = {
        name: data.worker.name,
        ops: data.worker.ops,
        vendor: data.worker.vendor.name,
      };

      const timeStr = new Date(data.log.time).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (data.action === "check-in") {
        setBreakDuration(
          `${Math.floor(data.durationMinutes / 60)
            .toString()
            .padStart(
              2,
              "0",
            )}:${(data.durationMinutes % 60).toString().padStart(2, "0")}`,
        );
        setOverdueMinutes(data.overdueMinutes || 0);

        setActiveBreaks((prev) => {
          const next = new Map(prev);
          next.delete(workerInfo.ops);
          return next;
        });

        setScannedWorker(workerInfo);
        setState("check-in");

        setScanLog((prev) => [
          {
            id: data.log.id,
            name: workerInfo.name,
            ops: workerInfo.ops,
            type: "check-in",
            time: timeStr,
            vendor: workerInfo.vendor,
          },
          ...prev.slice(0, 9),
        ]);
      } else {
        setActiveBreaks((prev) => {
          const next = new Map(prev);
          next.set(workerInfo.ops, {
            workerId: workerInfo.ops,
            checkOutTime: new Date(data.activeBreak.checkOutTime),
          });
          return next;
        });

        setScannedWorker(workerInfo);
        setState("check-out");
        setCountdown(3600);

        setScanLog((prev) => [
          {
            id: data.log.id,
            name: workerInfo.name,
            ops: workerInfo.ops,
            type: "check-out",
            time: timeStr,
            vendor: workerInfo.vendor,
          },
          ...prev.slice(0, 9),
        ]);
      }

      startAutoClose();
      setShowManualInput(false);
      setManualQuery("");
    } catch (err) {
      setManualError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value;
      if (value) {
        processScan(value);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualQuery.trim()) {
      setManualError("Masukkan OPS ID pekerja");
      return;
    }
    processScan(manualQuery);
  };

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleManualSubmit();
    }
    if (e.key === "Escape") {
      setShowManualInput(false);
      setManualQuery("");
      setManualError("");
    }
  };

  const getCountdownClass = () => {
    if (countdown <= 0) return styles.countdownOverdue;
    if (countdown <= 600) return styles.countdownWarning;
    return styles.countdownNormal;
  };

  return (
    <div className={styles.page}>
      {/* Hidden scanner input */}
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        onKeyDown={handleKeyDown}
        autoFocus
        aria-label="Scanner input"
        disabled={loading}
      />

      {/* Left Panel — Feedback */}
      <div className={styles.feedbackPanel}>
        {state === "idle" && !showManualInput && (
          <div className={styles.idleState}>
            <span className={styles.idleIcon}>📱</span>
            <h2 className={styles.idleTitle}>Silakan Scan ID Pekerja Anda</h2>
            <p className={styles.idleSubtitle}>
              Arahkan OPS ID atau card ke scanner
            </p>

            <button
              className={styles.manualTriggerBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowManualInput(true);
              }}>
              ⌨️ Lupa ID Card? Input Manual
            </button>

            <p className={styles.idleHint}>Contoh OPS: OPS1702656</p>
          </div>
        )}

        {state === "idle" && showManualInput && (
          <div className={styles.manualInputState}>
            <span className={styles.manualIcon}>⌨️</span>
            <h2 className={styles.manualTitle}>Input Manual</h2>
            <p className={styles.manualSubtitle}>Masukkan OPS ID Pekerja</p>

            <div className={styles.manualInputWrap}>
              <input
                ref={manualInputRef}
                type="text"
                className={styles.manualInput}
                placeholder="Contoh: OPS1702656"
                value={manualQuery}
                onChange={(e) => {
                  setManualQuery(e.target.value);
                  setManualError("");
                }}
                onKeyDown={handleManualKeyDown}
                onClick={(e) => e.stopPropagation()}
                disabled={loading}
              />
              <button
                className={styles.manualSubmitBtn}
                onClick={handleManualSubmit}
                disabled={loading}>
                {loading ? "..." : "Proses →"}
              </button>
            </div>
            {manualError && <p className={styles.manualError}>{manualError}</p>}
            <button
              className={styles.manualCancelBtn}
              onClick={() => {
                setShowManualInput(false);
                setManualQuery("");
                setManualError("");
              }}>
              ← Kembali ke mode scan
            </button>
          </div>
        )}

        {state === "check-out" && scannedWorker && (
          <div className={styles.scannedResult}>
            <div className={`${styles.scannedAvatar} ${styles.avatarCheckOut}`}>
              {scannedWorker.name.charAt(0)}
            </div>
            <h2 className={styles.scannedName}>{scannedWorker.name}</h2>
            <p className={styles.scannedInfo}>
              {scannedWorker.ops} · {scannedWorker.vendor}
            </p>
            <div className={`${styles.statusBadge} ${styles.badgeCheckOut}`}>
              🟡 CHECK-OUT — Istirahat Dimulai
            </div>
            <div className={`${styles.countdown} ${getCountdownClass()}`}>
              {formatCountdown(countdown)}
            </div>
            <div className={styles.countdownLabel}>Sisa waktu istirahat</div>
            <div
              className={styles.autoCloseBar}
              style={{ width: `${autoCloseProgress}%` }}
            />
          </div>
        )}

        {state === "check-in" && scannedWorker && (
          <div className={styles.scannedResult}>
            <div
              className={`${styles.scannedAvatar} ${overdueMinutes > 0 ? styles.avatarOverdue : styles.avatarCheckIn}`}>
              {scannedWorker.name.charAt(0)}
            </div>
            <h2 className={styles.scannedName}>{scannedWorker.name}</h2>
            <p className={styles.scannedInfo}>
              {scannedWorker.ops} · {scannedWorker.vendor}
            </p>
            <div
              className={`${styles.statusBadge} ${overdueMinutes > 0 ? styles.badgeOverdue : styles.badgeCheckIn}`}>
              {overdueMinutes > 0
                ? "🔴 OVERDUE"
                : "🟢 CHECK-IN — Selamat Bekerja Kembali"}
            </div>
            <div className={styles.durationDisplay}>{breakDuration}</div>
            <div className={styles.durationLabel}>Total durasi istirahat</div>
            {overdueMinutes > 0 && (
              <div className={styles.overdueMsg}>
                Terlambat {overdueMinutes} menit
              </div>
            )}
            <div
              className={styles.autoCloseBar}
              style={{ width: `${autoCloseProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Right Panel — Log */}
      <div className={styles.logPanel}>
        <div className={styles.logHeader}>
          <span className={styles.logTitle}>📋 Riwayat Scan</span>
          <button className={styles.exitBtn} onClick={() => router.push("/")}>
            ← Kembali
          </button>
        </div>
        <div className={styles.logList}>
          {scanLog.length === 0 ? (
            <div className={styles.logEmpty}>
              Belum ada scan hari ini.
              <br />
              Scan ID Pekerja untuk memulai.
            </div>
          ) : (
            scanLog.map((log) => (
              <div key={log.id} className={styles.logItem}>
                <div
                  className={`${styles.logAvatar} ${
                    log.type === "check-out"
                      ? styles.logAvatarOut
                      : styles.logAvatarIn
                  }`}>
                  {log.name.charAt(0)}
                </div>
                <div className={styles.logInfo}>
                  <div className={styles.logName}>{log.name}</div>
                  <div className={styles.logDetail}>
                    {log.ops} ·{" "}
                    {log.type === "check-out"
                      ? "→ Mulai istirahat"
                      : "← Kembali bekerja"}
                  </div>
                </div>
                <span className={styles.logTime}>{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
