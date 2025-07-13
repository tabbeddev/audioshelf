import type { PageServerLoad } from "../../../../.svelte-kit/types/src/routes/setup/2/$types.d.ts";
import { db } from "../../../lib/prisma.ts";

export const load = (async () => {
  return {libraries: await db.libraries.findMany()};
}) satisfies PageServerLoad;
