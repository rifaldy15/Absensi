import prisma from "./prisma";

export interface SystemSettings {
  graceMinutes: number;
  activeShifts: string[];
}

export const DEFAULT_SETTINGS: SystemSettings = {
  graceMinutes: 30,
  activeShifts: ["08:00", "09:00", "15:00", "19:00", "23:00", "00:00"],
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: "global" },
    });

    if (!settings) return DEFAULT_SETTINGS;

    return {
      graceMinutes: settings.graceMinutes,
      activeShifts: settings.activeShifts.split(",").map((s) => s.trim()),
    };
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return DEFAULT_SETTINGS;
  }
}
