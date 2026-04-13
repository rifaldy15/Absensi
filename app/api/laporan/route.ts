import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // You can add date filtering via searchParams if needed later

    // Fetch all check-in logs, as they contain the duration and overdue stats
    const checkInLogs = await prisma.scanLog.findMany({
      where: {
        type: "check-in",
      },
      orderBy: { time: "desc" },
      include: {
        worker: {
          include: { vendor: true },
        },
      },
    });

    // Format for DAILY_DATA
    const dailyData = checkInLogs.map((log) => {
      const checkInTime = new Date(log.time);
      // approximate check-out time based on duration
      const checkOutTime = new Date(
        checkInTime.getTime() - (log.duration || 0) * 60000,
      );

      return {
        id: log.id,
        name: log.worker.name,
        ops: log.worker.ops,
        vendor: log.worker.vendor.name,
        out: checkOutTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        in: checkInTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: log.duration || 0,
        late: log.overdueMinutes || 0,
      };
    });

    // Format for VENDORS_RECAP
    const vendorMap = new Map<
      string,
      { total: number; onTime: number; late: number; totalDuration: number }
    >();

    dailyData.forEach((d) => {
      const v = vendorMap.get(d.vendor) || {
        total: 0,
        onTime: 0,
        late: 0,
        totalDuration: 0,
      };
      v.total += 1;
      v.totalDuration += d.duration;
      if (d.late > 0) v.late += 1;
      else v.onTime += 1;
      vendorMap.set(d.vendor, v);
    });

    const vendorsRecap = Array.from(vendorMap.entries()).map(
      ([name, stats]) => ({
        name,
        total: stats.total,
        onTime: stats.onTime,
        late: stats.late,
        avgDuration:
          stats.total > 0 ? Math.round(stats.totalDuration / stats.total) : 0,
      }),
    );

    // Fetch vendor list for filter dropdown
    const vendorsList = await prisma.vendor.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      dailyData,
      vendorsRecap,
      vendors: vendorsList.map((v) => v.name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch laporan data" },
      { status: 500 },
    );
  }
}
