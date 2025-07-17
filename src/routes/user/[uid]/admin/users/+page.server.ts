import { db } from "$lib/server/prisma.ts";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const users = await db.user.findMany();

  return { users };
}) satisfies PageServerLoad;
