import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const load = (async ({ params }) => {
  const { albumid } = params;
  try {
    Number(albumid);
  } catch {
    return error(400, { message: "Invalid uid." });
  }

  const id = Number(albumid);
  const album = await db.album.findUnique({ where: { id }, select: { id: true, name: true, titles: true } });

  if (!album) return error(404, { message: "Unknown album" });

  return { album };
}) satisfies PageServerLoad;
