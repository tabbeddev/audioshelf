import { error } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../../../.svelte-kit/types/src/routes/api/users/[uid]/playstate/$types.d.ts";
import { db } from "../../../../../lib/prisma.ts";

export const POST: RequestHandler = async ({ request, params }) => {
  // State validation
  const { albumid, titleid, position }: { albumid: number; titleid: number; position: number } = await request.json();

  if (!(albumid && titleid && position !== undefined)) return error(400, { message: "Not all required data is given" });

  // User validation
  const { uid } = params;
  try {
    Number(uid);
  } catch {
    return error(400, { message: "Invalid uid" });
  }

  const user = await db.user.findUnique({
    where: { id: Number(uid) },
  });
  if (!user) return error(404, { message: "Unknown user" });

  const userid = Number(uid);

  // Save
  await db.saveState.updateMany({ where: { userid }, data: { lastplayed: false } });
  await db.saveState.upsert({
    where: { userid_albumid: { userid, albumid } },
    update: { titleid, position, lastplayed: true },
    create: { titleid, albumid, position, userid, lastplayed: true },
  });

  return new Response();
};
