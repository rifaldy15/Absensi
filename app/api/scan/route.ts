import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.scanLog.findMany({
      orderBy: { time: "desc" },
      take: 10,
      include: {
        worker: {
          include: { vendor: true },
        },
      },
    });

    const activeBreaks = await prisma.activeBreak.findMany({
      include: {
        worker: {
          include: { vendor: true },
        },
      },
    });

    return NextResponse.json({ logs, activeBreaks });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scan init data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { opsId } = await request.json();

    // Find worker by OPS ID
    const worker = await prisma.worker.findUnique({
      where: { ops: opsId },
      include: { vendor: true },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Check if worker is already on break
    const activeBreak = await prisma.activeBreak.findUnique({
      where: { workerId: worker.id },
    });

    const now = new Date();

    if (activeBreak) {
      // CHECK-IN Logic (Returning from break)
      const checkOutTime = new Date(activeBreak.checkOutTime);
      const durationMs = now.getTime() - checkOutTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000); // Minutes

      const overdueMinutes = durationMinutes > 60 ? durationMinutes - 60 : 0;

      // 1. Log the check-in
      const log = await prisma.scanLog.create({
        data: {
          type: "check-in",
          time: now,
          workerId: worker.id,
          duration: durationMinutes,
          overdueMinutes: overdueMinutes > 0 ? overdueMinutes : null,
        },
        include: { worker: { include: { vendor: true } } },
      });

      // 2. Remove from active break
      await prisma.activeBreak.delete({
        where: { workerId: worker.id },
      });

      return NextResponse.json({
        action: "check-in",
        worker,
        log,
        durationMinutes,
        overdueMinutes,
      });
    } else {
      // CHECK-OUT Logic (Going on break)

      // 1. Add to active breaks
      const newBreak = await prisma.activeBreak.create({
        data: {
          workerId: worker.id,
          checkOutTime: now,
        },
      });

      // 2. Log the check-out
      const log = await prisma.scanLog.create({
        data: {
          type: "check-out",
          time: now,
          workerId: worker.id,
        },
        include: { worker: { include: { vendor: true } } },
      });

      return NextResponse.json({
        action: "check-out",
        worker,
        log,
        activeBreak: newBreak,
      });
    }
  } catch (error) {
    console.error("Scan Error:", error);
    return NextResponse.json(
      { error: "Failed to process scan" },
      { status: 500 },
    );
  }
}
