import { get } from "svelte/store";
import { convertDiscsToTitles, convertMetadataListToAlbum } from "./albumUtil.ts";
import { albumDB } from "./stores/albumDB.ts";

export async function downloadAlbum(id: number) {
  if (!("caches" in window)) return console.warn("Cache not available");
  if (id in get(albumDB)) return console.warn(id + " already downloaded");

  const metaResponse = await fetch("/api/albums/" + id);
  if (!metaResponse.ok) throw new Error("Response not okay: " + (await metaResponse.text()));

  const metadata: Data.Metadata = await metaResponse.json();

  const titles = convertDiscsToTitles(metadata.discs);

  for (const title of titles) {
    const response = await fetch("/api/titles/" + title.id);

    if (response.status !== 200) throw new Error(`Unsupported Status Code: ${response.status} (${response.statusText})`);
    console.log("Downloaded: " + title.title);
  }

  albumDB.update((v) => {
    v[id] = metadata;
    return v;
  });
}

export function softDelete(id: number) {
  if (!("caches" in window)) return console.warn("Cache not available");
  console.log("Soft-deleting: " + id);

  albumDB.update((v) => {
    delete v[id];
    return v;
  });
}

export async function searchFor(query: string, useServer: boolean): Promise<Data.SearchResult> {
  if (useServer) {
    const response = await fetch("/api/search?q=" + query);
    if (!response.ok) {
      postMessage({ type: "error", title: "Search request failed", subtitle: (await response.json()).message } as App.Notification);
      return { albums: [], titles: [] };
    }

    return await response.json();
  } else {
    query = query.toLowerCase();
    const metadata = get(albumDB);
    const albums = convertMetadataListToAlbum(metadata);
    const titles = albums
      .map((v) =>
        v.titles.map((t) => {
          return { ...t, album_entry: { id: v.id } };
        })
      )
      .flat();

    const resultAlbums = albums
      .filter((v) => v.name.toLowerCase().includes(query))
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10);

    const resultTitles = titles
      .filter((v) => v.title.toLowerCase().includes(query) || v.artist.toLocaleLowerCase().includes(query))
      .toSorted((a, b) => a.title.localeCompare(b.title))
      .slice(0, 15);

    return { albums: resultAlbums, titles: resultTitles };
  }
}
