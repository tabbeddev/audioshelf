import type { PrismaClient as ImportedPrismaClient, Prisma as ImportedPrisma } from "@prisma/client";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const { PrismaClient: RequiredPrismaClient, Prisma: RequiredPrisma } = require("@prisma/client");

const _PrismaClient: typeof ImportedPrismaClient = RequiredPrismaClient;
export const Prisma: typeof ImportedPrisma = RequiredPrisma;

export class PrismaClient extends _PrismaClient {}
