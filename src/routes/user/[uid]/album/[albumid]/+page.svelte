<script lang="ts">
  import { getAlbumLength, getArtistsOfAlbum, getGenresOfAlbum, listDiscs } from "$lib/albumUtil";
  import Cover from "$lib/components/covers/cover.svelte";
  import { secondStringify } from "$lib/util";
  import { BookAudio, Disc, Play } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { MediaQuery } from "svelte/reactivity";

  const { data }: { data: PageData } = $props();
</script>

{#if data.album}
  {@const discs = listDiscs(data.album.titles)}
  <div class="flex max-md:flex-col p-6 gap-4 max-md:items-center">
    <Cover Icon={BookAudio} />
    <div class="mt-2 text-center md:text-left">
      <h1 class="text-4xl font-bold">{data.album.name}</h1>
      <p class="text-2xl font-light">
        by
        <span class="font-semibold">{getArtistsOfAlbum(data.album)}</span>
      </p>
      <p class="text-xl">Length: {secondStringify(getAlbumLength(data.album))}</p>
      <p class="text-lg">Genre: {getGenresOfAlbum(data.album)}</p>
      <div class="flex justify-center md:justify-normal">
        <button
          class="iconbtn mt-2"
          onclick={() => {
            postMessage({ albumid: data.album!.id, type: "playAlbum" } as App.PlayRequest);
          }}
        >
          <Play />
          Play
        </button>
      </div>
    </div>
  </div>

  {#each discs as [disc, titles]}
    <p class="iconbtn border-b-2 pb-1 my-2 mx-2">
      <Disc size="32" />
      <span class="text-2xl">Disc {disc}</span>
      <span class="font-light">({titles.length} titles)</span>
    </p>
    {#each titles as title}
      <p class="iconbtn mx-3 my-1">
        <button
          class="iconbtn sm secondary"
          onclick={() => {
            postMessage({ albumid: data.album!.id, type: "playAlbum", starttitleid: title.id } as App.PlayRequest);
          }}
        >
          {#if new MediaQuery("width >= 40rem").current}
            <Play strokeWidth="1.75" />
          {:else}
            <span class="border-2 rounded-[100%] h-8 w-8 flex items-center justify-center shrink-0">{Number(title.track)}</span>
          {/if}
        </button>
        <span class="border-2 rounded-[100%] h-8 w-8 items-center justify-center shrink-0 hidden sm:flex">{Number(title.track)}</span>
        <span class="w-16 max-sm:hidden">{secondStringify(title.length)}</span>
        <span class="text-lg">{title.title}</span>
      </p>
    {/each}
  {/each}
{/if}
