// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import pkg from "@prisma/client";

declare global {
  namespace App {
    interface Notification {
      type: "error" | "warning" | "notification";
      title: string;
      subtitle: string;
    }

    interface PlayRequest {
      type: "playAlbum";
      albumid: number;
      starttitleid?: number;
      position?: number;
    }
  }

  namespace Data {
    interface Tags {
      title: string;
      artist: string;
      album: string;
      track?: string;
      genre: string;
      length: number;
      disk: string;
    }

    type Album = pkg.Album & { titles: pkg.Titles[] };
  }
}

export {};
