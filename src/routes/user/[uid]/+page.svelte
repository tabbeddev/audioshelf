<script lang="ts">
  import { calcElapsedTime, getAlbumLength, getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "$lib/components/covers/book.svelte";
  import CoverRow from "$lib/components/covers/coverRow.svelte";
  import { secondStringify } from "$lib/util";
  import { BookAudio, BookOpen } from "@lucide/svelte";
  import type { LayoutData, PageData } from "./$types";

  let { data }: { data: PageData & LayoutData } = $props();
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
    {#each data.states as state}
      {@const album = data.allAlbums.find((v) => v.id === state.albumid)!}
      {@const albumLength = getAlbumLength(album)}
      {@const elapsedTime = calcElapsedTime(state.titleid, album) + state.position}

      {#snippet items(album: Data.Album)}
        <span class="w-64 font-semibold">{album.name}</span>
        <span class="w-64 font-light">{getArtistsOfAlbum(album)}</span>
        <div class="scnbg w-64 h-6 rounded-sm">
          <div
            class="prmbg h-full flex items-center justify-center rounded-sm z-0"
            style:width={(elapsedTime / albumLength) * 100 + "%"}
          ></div>
          <div class="-translate-y-[95%] z-10">{secondStringify(elapsedTime)} / {secondStringify(getAlbumLength(album))}</div>
        </div>
      {/snippet}

      <Book
        {album}
        {items}
        onclick={() => {
          postMessage({
            type: "playAlbum",
            albumid: state.albumid,
            position: state.position,
            starttitleid: state.titleid,
          } as App.PlayRequest);
        }}
        hoverPlay={true}
      />
    {/each}
  </div>
{/if}

<hr />

<h1 class="text-3xl font-medium iconbtn mb-2">
  <BookAudio class="shrink-0" />
  Audiobooks
</h1>
<CoverRow albums={data.allAlbums} />

<hr />
