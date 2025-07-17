import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const load = (async ({ params }) => {
  const { uid } = params;
  if (!Number(uid)) return error(400, { message: "No uid" });

  try {
    Number(uid);
  } catch {
    return error(400, { message: "Invalid uid." });
  }

  const user = await db.user.findUnique({
    where: { id: Number(uid) },
  });
  if (!user) return error(404, { message: "Unknown user" });

  const states = await db.saveState.findMany({ where: { userid: user.id } });

  return { user, states };
}) satisfies LayoutServerLoad;
