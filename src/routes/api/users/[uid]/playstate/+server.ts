import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";

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

export const DELETE: RequestHandler = async ({ request, params }) => {
  // State validation
  const { albumid }: { albumid: number } = await request.json();

  if (!albumid) return error(400, { message: "No albumid specified" });

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

  await db.saveState.delete({ where: { userid_albumid: { userid, albumid } } });

  return new Response();
};
