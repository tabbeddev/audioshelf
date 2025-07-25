import { lookup } from "mime-types";
import { transformTags } from "./id3.ts";
import { db } from "./prisma.ts";
import { readdirSync, realpathSync, lstatSync } from "node:fs";
import { parseFile, type IAudioMetadata } from "music-metadata";

async function addTitle(filePath: string) {
  console.log("Scraping -> " + filePath);

  let rawMetadata;
  try {
    rawMetadata = await parseFile(filePath);
  } catch {
    rawMetadata = { common: {} } as IAudioMetadata;
  }
  const metadata = await transformTags(filePath, rawMetadata);

  await db.album.upsert({ update: {}, where: { name: metadata.album }, create: { name: metadata.album } });

  await db.titles.upsert({
    where: { path: filePath },
    update: { ...metadata },
    create: { ...metadata, path: filePath },
  });
}

export async function scrapeLibraries(rebuild: boolean = false) {
  console.log("Started Scraping Libraries...");

  // Walk through the library
  async function readLayer(path: string, layer: number = 0) {
    const content = readdirSync(path);
    if (layer >= 2) {
      // Expect titles
      for (const file of content) {
        const fullPath = realpathSync(path) + "/" + file;
        if (lstatSync(fullPath).isDirectory()) continue;

        if (existingFiles.includes(fullPath)) continue;

        if ((lookup(file) || undefined)?.startsWith("audio")) {
          await addTitle(fullPath);
        } else {
          console.log(`Skipping ${file} -> File is not an audio file`);
        }
      }
    } else {
      for (const item of content) {
        const fullPath = realpathSync(path) + "/" + item;
        if (!lstatSync(fullPath).isDirectory()) continue;

        await readLayer(fullPath, layer + 1);
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
