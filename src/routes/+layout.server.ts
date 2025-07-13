import { db } from "../lib/prisma.ts";
import type { PageServerLoad } from "../../.svelte-kit/types/src/routes/$types.d.ts";

export const load = (async () => {
  return { users: (await db.user.findMany()).length };
}) satisfies PageServerLoad;
