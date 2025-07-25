import { error } from "@sveltejs/kit";
import JSZip from "jszip";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";
import { sprintf } from "sprintf-js";
import { extname } from "node:path";
import { readFileSync } from "node:fs";
import { getArtistsOfAlbum } from "$lib/albumUtil.ts";

export const GET: RequestHandler = async ({ params }) => {
  try {
    Number(params.albumid);
  } catch {
    return error(400, { message: "Invalid albumid" });
  }

  const albumid = Number(params.albumid);
  const album = await db.album.findUnique({ where: { id: albumid }, include: { titles: true } });

  if (!album) return error(404, { message: "No album found" });

  const lengthTracks = Math.max(...album.titles.map((v) => v.track || 0), 10).toString().length;
  const lengthDiscs = album.titles.map((v) => v.disk).toString().length;

  const zip = new JSZip();
  const zipFolder = zip.folder(getArtistsOfAlbum(album.titles))!.folder(album.name)!;

  for (const track of album.titles) {
    const extension = extname(track.path);
    const name = sprintf(`%0${lengthDiscs}d%0${lengthTracks}d - ${track.title}${extension}`, track.disk || 0, track.track || 0);

    const fileContent = readFileSync(track.path);

    zipFolder.file(name, fileContent);
  }

  const file = await zip.generateAsync({ type: "blob" });

  return new Response(file, {
    headers: {
      "Content-Disposition": `attachment; filename=${album.name}.zip`,
      "Content-Type": "application/zip",
    },
  });
};
