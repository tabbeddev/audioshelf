import pkg from "@prisma/client";
const { PrismaClient } = pkg;
export const { Prisma } = pkg;

export const db = new PrismaClient();

globalThis.addEventListener("unload", async () => {
  console.log("Goodbye");
  await db.$disconnect();
});
