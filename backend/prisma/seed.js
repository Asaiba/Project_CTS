import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@cts.local";
  const passwordHash = await bcrypt.hash("Admin@12345", 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "admin",
      username: "system_admin",
      isActive: true,
    },
    create: {
      email: adminEmail,
      username: "system_admin",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log("Seed complete. Admin: admin@cts.local / Admin@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
