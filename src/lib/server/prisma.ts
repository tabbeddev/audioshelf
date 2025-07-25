import { PrismaClient } from "$lib/server/prismaFix";

export const db = new PrismaClient();