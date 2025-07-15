import { db } from "../../../../../lib/prisma.ts";
import type { PageServerLoad } from "../../../../../../.svelte-kit/types/src/routes/user/[uid]/admin/users/$types.d.ts";

export const load = (async () => {
  const users = await db.user.findMany();

  return { users };
}) satisfies PageServerLoad;
