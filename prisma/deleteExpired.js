const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Shift config mirrors lib/mock-data.ts
const GRACE_MINUTES = 30;

function isShiftExpired(shift) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startHour = parseInt(shift.split(":")[0]);
  const endMinutes = ((startHour + 9) * 60) % (24 * 60);
  const expireMinutes = (endMinutes + GRACE_MINUTES) % (24 * 60);

  if (startHour + 9 >= 24) {
    if (endMinutes <= GRACE_MINUTES) {
      return currentMinutes >= expireMinutes && currentMinutes < startHour * 60;
    }
    return currentMinutes >= expireMinutes && currentMinutes < startHour * 60;
  }
  return currentMinutes >= expireMinutes || currentMinutes < startHour * 60;
}

async function run() {
  const workers = await prisma.worker.findMany();
  let deletedCount = 0;

  for (const w of workers) {
    if (isShiftExpired(w.shift)) {
      await prisma.worker.delete({ where: { id: w.id } });
      deletedCount++;
    }
  }

  console.log(
    `Successfully deleted ${deletedCount} expired workers from database.`,
  );
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
