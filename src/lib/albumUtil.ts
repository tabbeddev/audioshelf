import pkg from "@prisma/client";

export const getArtistsOfAlbum = (titles: pkg.Titles[]) => [...new Set(titles.map((v) => v.artist))].join(", ");
export const getGenresOfAlbum = (album: Data.Album) => [...new Set(album.titles.map((v) => v.genre))].join(", ");

export const convertMetadataListToAlbum = (metadata: Data.MetadataList) =>
  Object.entries(metadata).map(([id, v]) => convertMetadataToAlbum(v, Number(id)));

export function convertMetadataToAlbum(metadata: Data.Metadata, id: number) {
  const titles = convertDiscsToTitles(metadata.discs);
  return { id, titles, name: metadata.name, _count: { titles: titles.length } };
}

export const convertDiscsToTitles = (discs: Data.Metadata["discs"]): pkg.Titles[] => Object.values(discs).flat();

export const getAlbumLength = (album: Data.Album) => album.titles.reduce((p, c) => p + c.length, 0);

export function listDiscs(titles: pkg.Titles[]) {
  function sortHelper(a: [string, pkg.Titles[]][]): typeof a {
    for (const i of a) {
      i[1].sort((a, b) => Number(a.track) - Number(b.track));
    }
    return a;
  }

  const rtrn: Record<string, pkg.Titles[]> = {};

  for (const title of titles) {
    if (!rtrn[title.disk]) rtrn[title.disk] = [];

    rtrn[title.disk].push(title);
  }

  return sortHelper(Object.entries(rtrn));
}

export function calcElapsedTime(currentTitle: number, album: Data.Album) {
  const discs = listDiscs(album.titles);
  const titles = discs.map((v) => v[1]).flat();

  let length = 0;
  for (const title of titles) {
    if (title.id === currentTitle) break;
    length += title.length;
  }
  return length;
}
