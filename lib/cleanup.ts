import prisma from "./prisma";
import { isShiftExpired, Shift } from "./mock-data";
import { getSystemSettings } from "./settings";

/**
 * Automatically detects and deletes workers whose shifts have expired
 * according to the dynamic graceMinutes setting.
 */
export async function autoCleanupExpiredWorkers() {
  try {
    const settings = await getSystemSettings();
    
    const workers = await prisma.worker.findMany({
      select: { id: true, shift: true, createdAt: true },
    });

    const now = new Date();
    const expiredIds = workers
      .filter((w) => {
        // Jangan hapus jika baru dibuat dalam 24 jam terakhir
        const hoursSinceCreation = (now.getTime() - w.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation < 24) return false;
        
        return isShiftExpired(w.shift as Shift, settings.graceMinutes);
      })
      .map((w) => w.id);

    if (expiredIds.length > 0) {
      await prisma.worker.deleteMany({
        where: {
          id: {
            in: expiredIds,
          },
        },
      });
      console.log(`[Auto-Cleanup] Deleted ${expiredIds.length} expired workers.`);
    }
  } catch (error) {
    console.error("[Auto-Cleanup] Failed to cleanup expired workers:", error);
  }
}
