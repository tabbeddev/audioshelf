import { Reader } from "jsmediatags";
import type { TagType } from "jsmediatags/types";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { basename } from "@std/path";

export const readMediaTags = (path: string): Promise<TagType> =>
  new Promise((resolve, reject) => {
    new Reader(path).read({
      onSuccess: (tag) => {
        resolve(tag);
      },
      onError: (error) => {
        reject(error);
      },
    });
  });

export async function transformTags(path: string, tags: TagType): Promise<Data.Tags> {
  const pathPieces = path.substring(1).split("/");

  return {
    title: tags.tags.title ?? basename(path),
    artist: tags.tags.artist ?? pathPieces[pathPieces.length - 3],
    album: tags.tags.album ?? pathPieces[pathPieces.length - 2],
    track: tags.tags.track,
    genre: tags.tags.genre ?? "Unknown",

    length: Math.round(await getAudioDurationInSeconds(path)),
    disk: tags.tags.TPOS?.data ?? "1",
  };
}
