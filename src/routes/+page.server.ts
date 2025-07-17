import { db } from "$lib/server/prisma.ts";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  return { users: await db.user.findMany() };
}) satisfies PageServerLoad;
