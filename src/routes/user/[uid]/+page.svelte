<script lang="ts">
  import { calcElapsedTime, convertMetadataListToAlbum, getAlbumLength, getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "$lib/components/covers/book.svelte";
  import CoverRow from "$lib/components/covers/coverRow.svelte";
  import { secondStringify } from "$lib/util";
  import { BookAudio, BookOpen, WifiOff } from "@lucide/svelte";
  import type { LayoutData, PageData } from "./$types";
  import { startedDB } from "$lib/stores/startedDB";
  import { albumDB } from "$lib/stores/albumDB";
  import { get } from "svelte/store";
  import { onMount } from "svelte";

  function unifyData(): [
    string,
    {
      titleid: number;
      position: number;
      lastplayed: boolean;
      length: number;
      name: string;
      artist: string;
      totalProgress: number;
    },
  ][] {
    if (data.serverAvailable) {
      // @ts-ignore
      return data.states
        .map((v) => {
          const album = data.allAlbums.find((i) => i.id === v.albumid);
          if (!album) return undefined;

          return [
            v.albumid.toString(),
            {
              titleid: v.titleid,
              position: v.position,
              lastplayed: v.lastplayed,
              length: getAlbumLength(album),
              name: album.name,
              artist: getArtistsOfAlbum(album.titles),
              totalProgress: calcElapsedTime(v.titleid, album) + v.position,
            },
          ];
        })
        .filter((v) => v !== undefined);
    }

    const states = get(startedDB)[data.user.id];
    const entries = Object.entries(states);

    return entries;
  }

  onMount(() => {
    hasCache = "caches" in window;
  });

  let { data }: { data: PageData & LayoutData } = $props();
  let hasCache = $state(true);
</script>

<h1 class="text-3xl font-medium iconbtn mb-2">
  <BookOpen class="shrink-0" />
  Started audiobooks
</h1>

{#if data.states.length === 0}
  <p class="lg:text-center font-bold text-2xl">There's nothing to continue from.</p>
  <p class="lg:text-center text-xl">Start an audiobook and you'll see it here.</p>
{:else}
  <div class="overflow-x-scroll w-full flex p-2 mb-2 gap-2">
    {#each unifyData() as [id, state]}
      {#snippet items()}
        <span class="w-64 font-semibold iconbtn justify-center">
          {#if !(data.serverAvailable || id in $albumDB)}
            <WifiOff />
          {/if}
          {state.name}
        </span>
        <span class="w-64 font-light">{state.artist}</span>
        <div class="scnbg w-64 h-6 rounded-sm">
          <div
            class="prmbg h-full flex items-center justify-center rounded-sm z-0"
            style:width={(state.totalProgress / state.length) * 100 + "%"}
          ></div>
          <div class="-translate-y-[95%] z-10">{secondStringify(state.totalProgress)} / {secondStringify(state.length)}</div>
        </div>
      {/snippet}

      <Book
        {items}
        onclick={() => {
          postMessage({
            type: "playAlbum",
            albumid: Number(id),
            position: state.position,
            starttitleid: state.titleid,
          } as App.PlayRequest);
        }}
        hoverPlay={true}
        disabled={!(data.serverAvailable || id in $albumDB)}
      />
    {/each}
  </div>
{/if}

<hr />
{#if data.serverAvailable}
  <h1 class="text-3xl font-medium iconbtn mb-2">
    <BookAudio class="shrink-0" />
    Audiobooks
  </h1>
  <CoverRow albums={data.allAlbums} notfound={{ title: "No audiobooks added.", subtitle: "Add a library to add some." }} />

  <hr />
{/if}

<h1 class="text-3xl font-medium iconbtn mb-2">
  <WifiOff class="shrink-0" />
  Downloaded Books
</h1>
{#if hasCache}
  <CoverRow
    albums={convertMetadataListToAlbum($albumDB)}
    notfound={{ title: "No audiobooks downloaded.", subtitle: "Connect to the server and download some." }}
  />
{:else}
  <p class="lg:text-center font-bold text-2xl">Downloads are not available</p>
{/if}
