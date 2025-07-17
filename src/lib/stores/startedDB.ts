import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

// Define the structure of the data
export type StartedData = Record<
  // userid
  number,
  Record<
    // albumid
    number,
    {
      titleid: number;
      position: number;
      lastplayed: boolean;

      length: number;
      name: string;
      artist: string;
      totalProgress: number;
    }
  >
>;

// Create the writable store
const initial: StartedData = {};

function createStartedStore() {
  // Load from localStorage if in browser
  const stored = browser && localStorage.getItem("startedDB") ? JSON.parse(localStorage.getItem("startedDB")!) : initial;

  const store: Writable<StartedData> = writable(stored);

  // Automatically persist to localStorage when store changes
  if (browser) {
    store.subscribe((value) => {
      localStorage.setItem("startedDB", JSON.stringify(value));
    });
  }

  return store;
}

export const startedDB = createStartedStore();
