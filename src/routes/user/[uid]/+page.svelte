<script lang="ts">
  import { calcElapsedTime, convertMetadataListToAlbum, getAlbumLength, getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "$lib/components/covers/book.svelte";
  import CoverRow from "$lib/components/covers/coverRow.svelte";
  import { secondStringify } from "$lib/util";
  import { FileQuestionMark, Info, Library, Square, SquareLibrary, WifiOff, X } from "@lucide/svelte";
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

  function forgetAlbum(albumid: number, index: number) {
    fetch(`/api/users/${data.user.id}/playstate`, { method: "DELETE", body: JSON.stringify({ albumid }) })
      .then(async (d) => {
        if (d.ok) {
          unifiedData.splice(index, 1);
        } else {
          postMessage({ type: "error", title: "Failed to delete Savestate", subtitle: (await d.json()).message } as App.Notification);
        }
      })
      .catch((e) => {
        postMessage({ type: "error", title: "Failed to delete Savestate", subtitle: e } as App.Notification);
      });
  }

  onMount(() => {
    hasCache = "caches" in window;
  });

  let { data }: { data: PageData & LayoutData } = $props();
  let hasCache = $state(true);

  const unifiedData = $state(unifyData());
</script>

<svelte:head>
	<title>Home | AudioShelf</title>
</svelte:head>

<h1 class="text-3xl font-medium iconbtn mb-2">
  {#if unifiedData.length === 0}
    <Square />
  {:else}
    <SquareLibrary />
  {/if}
  Started audiobooks
</h1>

{#if unifiedData.length === 0}
  <div class="flex items-center gap-3">
    <SquareLibrary size="48" strokeWidth={1.5} />
    <div>
      <h1 class="text-2xl font-semibold">You haven't started an audiobook</h1>
      <p>Start an audiobook and you'll see it here.</p>
    </div>
  </div>
{:else}
  <div class="overflow-x-scroll w-full flex p-2 mb-2 gap-2">
    {#each unifiedData as [id, state], index}
      {#snippet items()}
        <span class="w-64 font-semibold iconbtn justify-center">
          {#if !(data.serverAvailable || id in $albumDB)}
            <WifiOff />
          {/if}
          {state.name}
        </span>
        <span class="w-64 font-light">
          <span class="sr-only">by </span>
          {state.artist}
        </span>
        <div class="scnbg w-64 h-6 rounded-sm">
          <div
            class="prmbg h-full flex items-center justify-center rounded-sm z-0"
            style:width={(state.totalProgress / state.length) * 100 + "%"}
          ></div>
          <div class="-translate-y-[95%] z-10">
            <span class="sr-only">- Progress: </span>
            {secondStringify(state.totalProgress)} / {secondStringify(state.length)}
          </div>
        </div>
      {/snippet}

      {#snippet outeritems()}
        <button class="iconbtn secondary" onclick={() => forgetAlbum(Number(id), index)}>
          <X />
          Forget this audiobook
        </button>
      {/snippet}

      <Book
        {items}
        {outeritems}
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
    <Library class="shrink-0" />
    Audiobooks
  </h1>
  <CoverRow
    albums={data.allAlbums}
    notfound={{ title: "No audiobooks added.", subtitle: "Add a library to add some.", icon: FileQuestionMark }}
  />

  <hr />
{/if}

<h1 class="text-3xl font-medium iconbtn mb-2">
  <WifiOff class="shrink-0" />
  Downloaded Books
</h1>
{#if hasCache}
  <CoverRow
    albums={convertMetadataListToAlbum($albumDB)}
    notfound={{ title: "No audiobooks downloaded.", subtitle: "Connect to the server and download some.", icon: SquareLibrary }}
  />
{:else}
  <div class="flex items-center gap-3">
    <Info size="48" strokeWidth={1.5} />
    <div>
      <h1 class="text-2xl font-semibold">Downloads are not available</h1>
      <p>See the FAQ for more info.</p>
    </div>
  </div>
{/if}

{#if !data.serverAvailable}
  <hr />

  <div class="flex items-center gap-3">
    <Info size="48" strokeWidth={1.5} />
    <div>
      <h1 class="text-lg font-medium">Looking for all audiobooks?</h1>
      <p>It seems like you're not connected to your server.</p>
      <p>Connect to your server again, to see all your audiobooks</p>
    </div>
  </div>
{/if}
