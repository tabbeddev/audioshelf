import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../../.svelte-kit/types/src/routes/api/albums/[albumid]/$types.d.ts";
import { db } from "../../../../lib/prisma.ts";
import { listDiscs } from "../../../../lib/albumUtil.ts";

export const GET: RequestHandler = async ({ params }) => {
  try {
    Number(params.albumid);
  } catch {
    return error(400, { message: "Invalid albumid" });
  }

  const albumid = Number(params.albumid);
  const album = await db.album.findUnique({ where: { id: albumid }, select: { titles: true, name: true } });

  if (!album) return error(404, { message: "Album not found" });
  return json({
    name: album.name,
    discs: Object.fromEntries(listDiscs(album.titles)),
  });
};
