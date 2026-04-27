import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.setting.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: "global",
          graceMinutes: 30,
          activeShifts: "08:00,09:00,15:00,19:00,23:00,00:00",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const settings = await prisma.setting.upsert({
      where: { id: "global" },
      update: {
        graceMinutes: body.graceMinutes,
        activeShifts: body.activeShifts,
      },
      create: {
        id: "global",
        graceMinutes: body.graceMinutes || 30,
        activeShifts: body.activeShifts || "08:00,09:00,15:00,19:00,23:00,00:00",
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
