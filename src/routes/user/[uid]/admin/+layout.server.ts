import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "../../../../../.svelte-kit/types/src/routes/user/[uid]/admin/$types.d.ts";

export const load = (async ({ parent }) => {
  const parentData = await parent();

  if (!parentData.user.isadmin) return error(403, { message: "Not authorized" });

  return parentData;
}) satisfies LayoutServerLoad;
