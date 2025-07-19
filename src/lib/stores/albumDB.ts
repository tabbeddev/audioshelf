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
    if ("caches" in window) {
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
    } else {
      let subtitle = "See the FAQ for more help";

      if (location.protocol === "http:") subtitle = "See the FAQ for more help or switch to HTTPS";
      if (location.protocol === "https:") subtitle = "See the FAQ for more help or use a valid SSL certificate";

      postMessage({
        type: "warning",
        title: "You're not set up for offline use",
        subtitle,
      } as App.Notification);

      store.set({});
    }
  }

  return store;
}

export const albumDB = createAlbumStore();
