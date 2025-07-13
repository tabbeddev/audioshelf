import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "../../../../../../.svelte-kit/types/src/routes/user/[uid]/album/[albumid]/$types.d.ts";
import { db } from "../../../../../lib/prisma.ts";

export const load = (async ({ params }) => {
  const { albumid } = params;
  try {
    Number(albumid);
  } catch {
    return error(400, { message: "Invalid uid." });
  }

  const id = Number(albumid);

  if (!(await db.album.findUnique({ where: { id } }))) return error(404, { message: "Unknown album" });

  return { album: await db.album.findUnique({ where: { id }, select: { id: true, name: true, titles: true } }) };
}) satisfies PageServerLoad;
