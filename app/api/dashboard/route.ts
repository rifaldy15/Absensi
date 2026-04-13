import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const activeBreaks = await prisma.activeBreak.findMany({
      include: {
        worker: {
          include: { vendor: true },
        },
      },
    });

    const recentLogs = await prisma.scanLog.findMany({
      orderBy: { time: "desc" },
      take: 10,
      include: {
        worker: {
          include: { vendor: true },
        },
      },
    });

    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { workers: true },
        },
      },
    });

    return NextResponse.json({
      activeBreaks,
      recentLogs,
      vendors,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
