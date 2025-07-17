import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load = (async ({ parent }) => {
  const parentData = await parent();

  if (!parentData.user.isadmin) return error(403, { message: "Not authorized" });

  return parentData;
}) satisfies LayoutServerLoad;
