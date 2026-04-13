"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Demo: any credentials will work
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>⏱️</div>
          <h1 className={styles.logoTitle}>Break Monitor</h1>
          <p className={styles.logoSubtitle}>
            Sistem Absensi Istirahat Pekerja
          </p>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className={styles.input}
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className={styles.rememberRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" />
              Ingat saya
            </label>
            <span className={styles.forgotLink}>Lupa password?</span>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Masuk
          </button>
        </form>

        <div className={styles.footer}>
          © 2026 Break Monitor · Sistem Absensi Istirahat v1.0
        </div>
      </div>
    </div>
  );
}
