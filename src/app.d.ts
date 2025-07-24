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
    type Tags = Omit<pkg.Titles, "id" | "path">;

    type Album = pkg.Album & { titles: pkg.Titles[] };

    interface SearchResult {
      albums: (pkg.Album & { _count: { titles: number } } & {
        titles: { artist: string; length: number; genre: string }[];
      })[];
      titles: (pkg.Titles & { album_entry: { id: number } })[];
    }

    interface Metadata {
      name: string;
      discs: Record<string, pkg.Titles[]>;
    }

    type MetadataList = Record<number, Data.Metadata>;
  }

  interface Package {
    name: string;
    private: boolean;
    version: string;
    type: string;
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  }

  const PKG: package;
}

export {};
