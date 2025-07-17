import { get } from "svelte/store";
import { convertDiscsToTitles } from "./albumUtil.ts";
import { albumDB } from "./stores/albumDB.ts";

export async function downloadAlbum(id: number) {
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
  console.log("Soft-deleting: " + id);

  albumDB.update((v) => {
    delete v[id];
    return v;
  });
}
