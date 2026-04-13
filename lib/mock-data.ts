import { BreakWorker } from "@/components/dashboard/LiveTable";
import { FeedItem } from "@/components/dashboard/ActivityFeed";

// ========== SHIFT SYSTEM ==========
export const SHIFTS = [
  "08:00",
  "09:00",
  "15:00",
  "19:00",
  "23:00",
  "00:00",
] as const;
export type Shift = (typeof SHIFTS)[number];

// Each shift: 8h work + 1h break = 9h total
export function getShiftEndTime(shift: Shift): string {
  const startHour = parseInt(shift.split(":")[0]);
  const endHour = (startHour + 9) % 24;
  return `${String(endHour).padStart(2, "0")}:00`;
}

// Check if a shift is currently active
export function isShiftActive(shift: Shift): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startHour = parseInt(shift.split(":")[0]);
  const startMinutes = startHour * 60;
  const endMinutes = (startHour + 9) * 60; // 9 hours total

  if (endMinutes > 24 * 60) {
    // Crosses midnight (e.g., 19:00 → 04:00, 23:00 → 08:00)
    return (
      currentMinutes >= startMinutes || currentMinutes < endMinutes % (24 * 60)
    );
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Get currently active shifts
export function getActiveShifts(): Shift[] {
  return SHIFTS.filter((s) => isShiftActive(s));
}

// Check if shift has EXPIRED (30 min after shift end = auto-clear)
const GRACE_MINUTES = 30;

export function isShiftExpired(shift: Shift): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startHour = parseInt(shift.split(":")[0]);
  const endMinutes = ((startHour + 9) * 60) % (24 * 60); // shift end time in minutes
  const expireMinutes = (endMinutes + GRACE_MINUTES) % (24 * 60); // +30 min grace

  // Handle midnight crossing
  if (startHour + 9 >= 24) {
    // Shift ends after midnight (e.g. 19:00 shift ends 04:00, expires 04:30)
    // It remains expired from 04:30 until the next shift starts at 19:00
    return currentMinutes >= expireMinutes && currentMinutes < startHour * 60;
  }
  // Normal shift (no midnight crossing)
  // Shift (e.g. 08:00) ends 17:00, expires 17:30.
  // It is expired ONLY from 17:30 until 23:59. At 00:00, it becomes the upcoming shift for the new day.
  return currentMinutes >= expireMinutes;
}

// ========== MOCK DATA ==========
function minutesAgo(mins: number): Date {
  return new Date(Date.now() - mins * 60 * 1000);
}

export interface WorkerData {
  id: string;
  name: string;
  ops: string;
  vendor: string;
  shift: Shift;
}

export const ALL_WORKERS: WorkerData[] = [
  // Shift 08:00
  {
    id: "1",
    name: "Ahmad Fauzi",
    ops: "OPS1702656",
    vendor: "PT Maju Bersama",
    shift: "08:00",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    ops: "OPS1702741",
    vendor: "CV Cahaya Mandiri",
    shift: "08:00",
  },
  {
    id: "3",
    name: "Budi Santoso",
    ops: "OPS1702832",
    vendor: "PT Maju Bersama",
    shift: "08:00",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    ops: "OPS1702915",
    vendor: "PT Karya Utama",
    shift: "08:00",
  },
  {
    id: "5",
    name: "Eko Prasetyo",
    ops: "OPS1703001",
    vendor: "CV Cahaya Mandiri",
    shift: "08:00",
  },
  // Shift 09:00
  {
    id: "6",
    name: "Fitri Handayani",
    ops: "OPS1703122",
    vendor: "PT Karya Utama",
    shift: "09:00",
  },
  {
    id: "7",
    name: "Gunawan Wibowo",
    ops: "OPS1703245",
    vendor: "PT Maju Bersama",
    shift: "09:00",
  },
  {
    id: "8",
    name: "Hendra Kusuma",
    ops: "OPS1703378",
    vendor: "CV Sejahtera",
    shift: "09:00",
  },
  // Shift 15:00
  {
    id: "9",
    name: "Indah Permata",
    ops: "OPS1703456",
    vendor: "CV Sejahtera",
    shift: "15:00",
  },
  {
    id: "10",
    name: "Joko Widodo",
    ops: "OPS1703512",
    vendor: "PT Maju Bersama",
    shift: "15:00",
  },
  {
    id: "11",
    name: "Kartini Sari",
    ops: "OPS1703601",
    vendor: "CV Cahaya Mandiri",
    shift: "15:00",
  },
  {
    id: "12",
    name: "Lukman Hakim",
    ops: "OPS1703715",
    vendor: "PT Karya Utama",
    shift: "15:00",
  },
  // Shift 19:00
  {
    id: "13",
    name: "Maya Anggraini",
    ops: "OPS1703823",
    vendor: "CV Sejahtera",
    shift: "19:00",
  },
  {
    id: "14",
    name: "Naufal Rizky",
    ops: "OPS1703934",
    vendor: "PT Maju Bersama",
    shift: "19:00",
  },
  {
    id: "15",
    name: "Olivia Putri",
    ops: "OPS1704012",
    vendor: "CV Cahaya Mandiri",
    shift: "19:00",
  },
  // Shift 23:00
  {
    id: "16",
    name: "Putra Ramadhan",
    ops: "OPS1704134",
    vendor: "PT Maju Bersama",
    shift: "23:00",
  },
  {
    id: "17",
    name: "Qistina Zahra",
    ops: "OPS1704256",
    vendor: "CV Cahaya Mandiri",
    shift: "23:00",
  },
  // Shift 00:00
  {
    id: "18",
    name: "Rizal Mahendra",
    ops: "OPS1704378",
    vendor: "PT Karya Utama",
    shift: "00:00",
  },
  {
    id: "19",
    name: "Sari Dewi",
    ops: "OPS1704490",
    vendor: "CV Sejahtera",
    shift: "00:00",
  },
  {
    id: "20",
    name: "Taufik Hidayat",
    ops: "OPS1704512",
    vendor: "PT Maju Bersama",
    shift: "00:00",
  },
];

// Workers currently on break (for demo — only show if their shift is active)
export const MOCK_ON_BREAK: BreakWorker[] = [
  {
    id: "BRC001",
    name: "Ahmad Fauzi",
    ops: "OPS1702656",
    vendor: "PT Maju Bersama",
    shift: "08:00",
    checkOutTime: minutesAgo(72),
  },
  {
    id: "BRC002",
    name: "Siti Nurhaliza",
    ops: "OPS1702741",
    vendor: "CV Cahaya Mandiri",
    shift: "08:00",
    checkOutTime: minutesAgo(65),
  },
  {
    id: "BRC003",
    name: "Budi Santoso",
    ops: "OPS1702832",
    vendor: "PT Maju Bersama",
    shift: "08:00",
    checkOutTime: minutesAgo(53),
  },
  {
    id: "BRC004",
    name: "Dewi Lestari",
    ops: "OPS1702915",
    vendor: "PT Karya Utama",
    shift: "09:00",
    checkOutTime: minutesAgo(45),
  },
  {
    id: "BRC005",
    name: "Eko Prasetyo",
    ops: "OPS1703001",
    vendor: "CV Cahaya Mandiri",
    shift: "09:00",
    checkOutTime: minutesAgo(38),
  },
  {
    id: "BRC006",
    name: "Fitri Handayani",
    ops: "OPS1703122",
    vendor: "PT Karya Utama",
    shift: "15:00",
    checkOutTime: minutesAgo(30),
  },
  {
    id: "BRC007",
    name: "Gunawan Wibowo",
    ops: "OPS1703245",
    vendor: "PT Maju Bersama",
    shift: "15:00",
    checkOutTime: minutesAgo(22),
  },
  {
    id: "BRC008",
    name: "Hendra Kusuma",
    ops: "OPS1703378",
    vendor: "CV Sejahtera",
    shift: "19:00",
    checkOutTime: minutesAgo(15),
  },
  {
    id: "BRC009",
    name: "Indah Permata",
    ops: "OPS1703456",
    vendor: "CV Sejahtera",
    shift: "19:00",
    checkOutTime: minutesAgo(8),
  },
  {
    id: "BRC010",
    name: "Joko Widodo",
    ops: "OPS1703512",
    vendor: "PT Maju Bersama",
    shift: "23:00",
    checkOutTime: minutesAgo(3),
  },
];

export const MOCK_FEED: FeedItem[] = [
  {
    id: "F001",
    name: "Joko Widodo",
    type: "check-out",
    time: "12:57",
    vendor: "PT Maju Bersama",
  },
  {
    id: "F002",
    name: "Indah Permata",
    type: "check-out",
    time: "12:52",
    vendor: "CV Sejahtera",
  },
  {
    id: "F003",
    name: "Ratna Sari",
    type: "check-in",
    time: "12:50",
    vendor: "PT Karya Utama",
  },
  {
    id: "F004",
    name: "Hendra Kusuma",
    type: "check-out",
    time: "12:45",
    vendor: "CV Sejahtera",
  },
  {
    id: "F005",
    name: "Yusuf Hidayat",
    type: "check-in",
    time: "12:42",
    vendor: "PT Maju Bersama",
  },
  {
    id: "F006",
    name: "Gunawan Wibowo",
    type: "check-out",
    time: "12:38",
    vendor: "PT Maju Bersama",
  },
  {
    id: "F007",
    name: "Fitri Handayani",
    type: "check-out",
    time: "12:30",
    vendor: "PT Karya Utama",
  },
  {
    id: "F008",
    name: "Lina Marlina",
    type: "check-in",
    time: "12:28",
    vendor: "CV Cahaya Mandiri",
  },
  {
    id: "F009",
    name: "Eko Prasetyo",
    type: "check-out",
    time: "12:22",
    vendor: "CV Cahaya Mandiri",
  },
  {
    id: "F010",
    name: "Dewi Lestari",
    type: "check-out",
    time: "12:15",
    vendor: "PT Karya Utama",
  },
];

export const MOCK_STATS = {
  totalWorkers: ALL_WORKERS.length,
  onBreak: 10,
  overdue: 2,
  returned: 34,
};

export const VENDOR_BREAK_DATA = [
  { name: "PT Maju Bersama", count: 4, color: "#3B82F6" },
  { name: "CV Cahaya Mandiri", count: 2, color: "#06B6D4" },
  { name: "PT Karya Utama", count: 2, color: "#10B981" },
  { name: "CV Sejahtera", count: 2, color: "#F59E0B" },
];
