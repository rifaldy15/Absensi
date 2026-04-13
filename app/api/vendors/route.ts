import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        workers: true,
      },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const vendor = await prisma.vendor.create({
      data: {
        name: body.name,
      },
    });
    return NextResponse.json(vendor);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 },
    );
  }
}
