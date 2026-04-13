const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.scanLog.deleteMany();
  await prisma.activeBreak.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.vendor.deleteMany();

  // 1. Create Vendors
  const vendorData = [
    { name: "PT Maju Bersama" },
    { name: "CV Cahaya Mandiri" },
    { name: "PT Karya Utama" },
    { name: "CV Sejahtera" },
  ];

  const vendors = [];
  for (const v of vendorData) {
    const created = await prisma.vendor.create({ data: v });
    vendors.push(created);
  }

  // 2. Create Workers
  const workerData = [
    {
      name: "Ahmad Fauzi",
      ops: "OPS1702656",
      shift: "08:00",
      vendor: vendors[0].id,
    },
    {
      name: "Siti Nurhaliza",
      ops: "OPS1702741",
      shift: "08:00",
      vendor: vendors[1].id,
    },
    {
      name: "Budi Santoso",
      ops: "OPS1702832",
      shift: "09:00",
      vendor: vendors[0].id,
    },
    {
      name: "Dewi Lestari",
      ops: "OPS1702915",
      shift: "09:00",
      vendor: vendors[2].id,
    },
    {
      name: "Eko Prasetyo",
      ops: "OPS1703001",
      shift: "15:00",
      vendor: vendors[1].id,
    },
  ];

  for (const w of workerData) {
    await prisma.worker.create({
      data: {
        name: w.name,
        ops: w.ops,
        shift: w.shift,
        vendorId: w.vendor,
      },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
