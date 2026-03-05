import { prisma } from "./lib/prisma.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
