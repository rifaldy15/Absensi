import prisma from "./prisma";
import { isShiftExpired, Shift } from "./mock-data";

/**
 * Automatically detects and deletes workers whose shifts have expired
 * by more than 30 minutes, according to the isShiftExpired logic.
 *
 * Because schema.prisma defines onDelete: Cascade, deleting the worker
 * will also delete their ScanLogs and ActiveBreaks.
 */
export async function autoCleanupExpiredWorkers() {
  try {
    const workers = await prisma.worker.findMany({
      select: { id: true, shift: true },
    });

    const expiredIds = workers
      .filter((w) => isShiftExpired(w.shift as Shift))
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
