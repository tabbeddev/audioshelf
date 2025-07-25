<script lang="ts">
  import { getAlbumLength, getArtistsOfAlbum, getGenresOfAlbum, listDiscs } from "$lib/albumUtil";
  import Cover from "$lib/components/covers/cover.svelte";
  import { secondStringify } from "$lib/util";
  import { BookAudio, Disc, Download, FolderDown, Loader, Play, Trash2, X } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { MediaQuery } from "svelte/reactivity";
  import { goto } from "$app/navigation";
  import { albumDB } from "$lib/stores/albumDB";
  import { downloadAlbum } from "$lib/downloadLib";
  import { onMount } from "svelte";

  const { data }: { data: PageData } = $props();

  function download(id: number) {
    downloadPromise = downloadAlbum(id)
      .then(() => {
        downloadPromise = undefined;
      })
      .catch((e) => {
        downloadPromise = undefined;
        postMessage({ type: "error", title: "Failed to download", subtitle: e } as App.Notification);
      });
  }

  onMount(() => {
    hasCache = "caches" in window;
  });

  let downloadPromise = $state<Promise<void>>();
  let hasCache = $state(true);

  const discs = listDiscs(data.album.titles);
  const unavailable = !(data.serverAvailable || data.album.id in $albumDB);
</script>

<svelte:head>
  <title>{data.album.name} | AudioShelf</title>
</svelte:head>

<div class="flex max-md:flex-col p-6 gap-4 max-md:items-center">
  <Cover Icon={BookAudio} />
  <div class="mt-2 text-center md:text-left">
    <h1 class="text-4xl font-bold" aria-label="Album name">{data.album.name}</h1>
    <p class="text-2xl font-light" aria-label="Artist">
      by
      <span class="font-semibold">{getArtistsOfAlbum(data.album.titles)}</span>
    </p>
    <p class="text-xl" aria-label="Album length">Length: {secondStringify(getAlbumLength(data.album))}</p>
    <p class="text-lg" aria-label="Genre of album">Genre: {getGenresOfAlbum(data.album)}</p>
    <div class="flex max-md:justify-center gap-2">
      <button
        class="iconbtn mt-2"
        onclick={() => {
          postMessage({ albumid: data.album!.id, type: "playAlbum" } as App.PlayRequest);
        }}
        disabled={unavailable}
      >
        <Play />
        Play
      </button>

      {#if !hasCache}
        <button class="iconbtn mt-2 secondary" disabled>
          <X />
          Downloads are not available
        </button>
      {:else if downloadPromise}
        <button class="iconbtn mt-2" disabled>
          <Loader class="animate-spin" />
          Downloading...
        </button>
      {:else if data.album.id in $albumDB}
        <button class="iconbtn mt-2 secondary">
          <Trash2 />
          Remove Download
        </button>
      {:else}
        <button class="iconbtn mt-2" disabled={!data.serverAvailable} onclick={() => download(data.album!.id)}>
          <Download />
          Download
        </button>
      {/if}
    </div>

    <div class="flex max-md:justify-center gap-2">
      <button
        class="iconbtn mt-2 secondary"
        onclick={() => (window.location.href = `/api/albums/${data.album?.id}/download`)}
        disabled={!data.serverAvailable}
      >
        <FolderDown />
        Download as Zip
      </button>
    </div>
  </div>
</div>

{#each discs as [disc, titles]}
  <h2 class="iconbtn border-b-2 pb-1 my-2 mx-1">
    <Disc size="32" aria-hidden="true" />
    <span class="text-2xl">Disc {disc}</span>
    <span class="font-light">({titles.length} titles)</span>
  </h2>
  {#each titles as title}
    <div class="flex gap-2 items-center mx-2 my-1 pb-1 border-b-2 tinyborder">
      <button
        class="iconbtn sm secondary"
        onclick={() => {
          postMessage({ albumid: data.album!.id, type: "playAlbum", starttitleid: title.id } as App.PlayRequest);
        }}
        disabled={unavailable}
      >
        {#if new MediaQuery("width >= 40rem").current || !title.track}
          <Play strokeWidth="1.75" />
        {:else}
          <span class="border-2 rounded-[100%] h-8 w-8 flex items-center justify-center shrink-0">{title.track}</span>
        {/if}
        <span class="sr-only">Play {title.track !== null ? "track " + title.track : "this track"} of disc {title.disk}</span>
      </button>

      {#if title.track}
        <span class="border-2 rounded-[100%] h-8 w-8 items-center justify-center shrink-0 hidden sm:flex" aria-hidden="true"
          >{title.track}</span
        >
      {/if}

      <div>
        <p class="font-medium" aria-label="Title">
          {title.title}
        </p>

        <p class="text-sm text-gray-300">
          <span class="sr-only">Length: </span>
          {secondStringify(title.length)}
          •
          <span class="sr-only">Artist: </span>
          {title.artist}
        </p>
      </div>
    </div>
  {/each}
{/each}
