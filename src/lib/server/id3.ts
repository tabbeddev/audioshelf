import type { IAudioMetadata } from "music-metadata";

export async function transformTags(path: string, tags: IAudioMetadata): Promise<Data.Tags> {
  const pathPieces = path.substring(1).split("/");

  return {
    title: tags.common.title ?? pathPieces[pathPieces.length - 1],
    artist: tags.common.artist ?? pathPieces[pathPieces.length - 3],
    album: tags.common.album ?? pathPieces[pathPieces.length - 2],
    track: tags.common.track.no,
    genre: tags.common.genre?.[0] ?? "Unknown",
    length: Math.round(tags.format.duration!),
    disk: tags.common.disk.no ?? 1,
  };
}
