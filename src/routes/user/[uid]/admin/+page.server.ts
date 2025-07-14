import type { PageServerLoad } from "../../../../../.svelte-kit/types/src/routes/user/[uid]/admin/$types.d.ts";
import { db } from "../../../../lib/prisma.ts";

export const load = (async () => {
  const libraries = await db.libraries.findMany();

  return { libraries };
}) satisfies PageServerLoad;
