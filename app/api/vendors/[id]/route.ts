import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 },
    );
  }
}
