import { browser } from "$app/environment";
import { get, writable, type Writable } from "svelte/store";
import { convertDiscsToTitles } from "../albumUtil.ts";
import { softDelete } from "../downloadLib.ts";

// Create the writable store
const initial: Data.MetadataList = {};

function createAlbumStore() {
  // Load from localStorage if in browser
  const stored: Data.MetadataList =
    browser && localStorage.getItem("metadataDB") ? JSON.parse(localStorage.getItem("metadataDB")!) : initial;

  const store: Writable<Data.MetadataList> = writable(stored);

  // Automatically persist to localStorage when store changes
  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem("metadataDB", JSON.stringify(value));
    });

    caches.open("audiobook-data-v1").then(async (cache) => {
			console.log("DB cleanup started");

      for (const [id, data] of Object.entries(get(store))) {
        for (const title of convertDiscsToTitles(data.discs)) {
          if (!(await cache.match("/api/titles/" + title.id))) {
            softDelete(Number(id));
            console.log(`Soft-Delete Reason: Title ${title.id} not found`);
            break;
          }
        }
      }
    });
  }

  return store;
}

export const albumDB = createAlbumStore();
