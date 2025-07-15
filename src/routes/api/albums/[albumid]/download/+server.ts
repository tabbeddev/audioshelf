import { error } from "@sveltejs/kit";
import JSZip from "jszip";
import type { RequestHandler } from "../../../../../../.svelte-kit/types/src/routes/api/albums/[albumid]/download/$types.d.ts";
import { db } from "../../../../../lib/prisma.ts";
import { sprintf } from "jsr:@std/fmt/printf";
import { extname } from "jsr:@std/path";
import { readFileSync } from "node:fs";
import { getArtistsOfAlbum } from "../../../../../lib/albumUtil.ts";

export const GET: RequestHandler = async ({ params }) => {
  try {
    Number(params.albumid);
  } catch {
    return error(400, { message: "Invalid albumid" });
  }

  const albumid = Number(params.albumid);
  const album = await db.album.findUnique({ where: { id: albumid }, include: { titles: true, _count: true } });
  if (!album) return error(404, { message: "No album found" });

  const lengthTracks = Math.max(album._count.titles, 10).toString().length;
  const lengthDiscs = Math.max(...album.titles.map((v) => Number(v.track) || 0), 10).toString().length;

  const zip = new JSZip();
  const zipFolder = zip.folder(getArtistsOfAlbum(album))!.folder(album.name)!;

  for (const track of album.titles) {
    const extension = extname(track.path);
    const name = sprintf(
      `%.${lengthDiscs}d%.${lengthTracks}d - ${track.title}${extension}`,
      Number(track.disk) || 0,
      Number(track.track) || 0
    );

    const fileContent = readFileSync(track.path);

    zipFolder.file(name, fileContent);
  }

  const file = await zip.generateAsync({ type: "blob" });

  return new Response(file);
};
