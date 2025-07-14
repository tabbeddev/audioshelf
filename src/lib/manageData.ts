import { readMediaTags, transformTags } from "./id3.ts";
import { db } from "./prisma.ts";
import { basename, extname } from "jsr:@std/path";
import { contentType } from "jsr:@std/media-types";

async function addTitle(filePath: string) {
  console.log("Scraping -> " + filePath);

  try {
    const rawMetadata = await readMediaTags(filePath);
    const metadata = await transformTags(filePath, rawMetadata);

    await db.album.upsert({ update: {}, where: { name: metadata.album }, create: { name: metadata.album } });

    await db.titles.upsert({
      where: { path: filePath },
      update: { ...metadata },
      create: { ...metadata, path: filePath },
    });
  } catch {
    return console.warn(`Skipping -> ${basename(filePath)} - failed`);
  }
}

export async function scrapeLibraries(rebuild: boolean = false) {
  // Walk through the library
  async function readLayer(path: string, layer: number = 0) {
    const content = Deno.readDirSync(path);
    if (layer >= 2) {
      // Expect titles
      for (const file of content.filter((v) => !v.isDirectory)) {
        const fullPath = Deno.realPathSync(path) + "/" + file.name;

        if (existingFiles.includes(fullPath)) continue;

        const extension = extname(fullPath);

        if (contentType(extension)?.startsWith("audio")) {
          await addTitle(fullPath);
        } else {
          console.log(`Skipping ${file.name} -> File is not an audio file`);
        }
      }
    } else {
      for (const item of content.filter((v) => v.isDirectory)) {
        await readLayer(Deno.realPathSync(path) + "/" + item.name, layer + 1);
      }
    }
  }

  if (rebuild) {
    console.log("Rebuild -> Deleting DB");
    await db.titles.deleteMany();
    await db.album.deleteMany();
  }

  const existingFiles = (await db.titles.findMany({ select: { path: true } })).map((v) => v.path);
  const libs = await db.libraries.findMany();

  for (const lib of libs) {
    console.log(`Scraping -> Reading Library "${lib.name}"`);

    const { path } = lib;
    await readLayer(path);
  }

  // Delete save state for non-existing albums

  const albums = (await db.album.findMany({ select: { id: true } })).map((v) => v.id);
  const savedStates = await db.saveState.findMany({ select: { userid: true, albumid: true } });

  for (const state of savedStates) {
    if (albums.includes(state.albumid)) continue;
    await db.saveState.delete({ where: { userid_albumid: state } });
  }
}
