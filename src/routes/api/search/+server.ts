import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../.svelte-kit/types/src/routes/api/search/$types.d.ts";
import { db } from "../../../lib/prisma.ts";

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get("q") ?? url.searchParams.get("query");
  if (!query) return error(400, { message: "Missing query" });

  const albums = await db.album.findMany({
    where: { name: { contains: query } },
    include: { _count: true, titles: { select: { artist: true, length: true, genre: true } } },
  });
  const titles = await db.titles.findMany({
    where: { OR: [{ title: { contains: query } }, { artist: { contains: query } }] },
    include: { album_entry: { select: { id: true } } },
  });

  return json({ albums, titles }, { headers: { "Cache-Control": "public, max-age=120" } });
};
