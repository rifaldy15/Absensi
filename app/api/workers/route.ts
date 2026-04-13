import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        vendor: true,
      },
    });
    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const worker = await prisma.worker.create({
      data: {
        name: body.name,
        ops: body.ops,
        shift: body.shift,
        vendorId: body.vendorId,
      },
      include: {
        vendor: true,
      },
    });
    return NextResponse.json(worker);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 },
    );
  }
}
