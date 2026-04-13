import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const worker = await prisma.worker.update({
      where: { id },
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
      { error: "Failed to update worker" },
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

    // Prisma ensures cascading deletes if configured, but here we can just delete the worker
    await prisma.worker.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 },
    );
  }
}
