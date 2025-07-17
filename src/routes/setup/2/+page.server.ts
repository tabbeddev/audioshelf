import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const load = (async () => {
  return {libraries: await db.libraries.findMany()};
}) satisfies PageServerLoad;
