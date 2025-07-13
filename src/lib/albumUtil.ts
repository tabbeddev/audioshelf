import pkg from "@prisma/client";

export const getArtistsOfAlbum = (album: Data.Album) => [...new Set(album.titles.map((v) => v.artist))].join(", ");

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
