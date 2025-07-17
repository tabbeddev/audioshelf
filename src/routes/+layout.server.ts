import { db } from "$lib/server/prisma.ts";
import type { LayoutServerLoad } from "./$types";

export const load = (async () => {
  return { users: (await db.user.findMany()).length };
}) satisfies LayoutServerLoad;
