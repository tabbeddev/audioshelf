import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const load = (async () => {
  const libraries = await db.libraries.findMany();

  return { libraries };
}) satisfies PageServerLoad;
