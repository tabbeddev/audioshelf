<script lang="ts">
  import { getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "./book.svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  const { albums }: { albums: Data.Album[] } = $props();
</script>

{#snippet titles(album: Data.Album)}
  <span class="w-64 font-semibold">{album.name}</span>
  <span class="w-64 font-light">{getArtistsOfAlbum(album)}</span>
{/snippet}

{#if albums.length === 0}
  <p class="text-center font-bold text-2xl">No audiobooks added.</p>
  <p class="text-center text-xl">Add a library to add some.</p>
{:else}
  <div class="overflow-x-scroll w-full flex p-2 mb-2 gap-2">
    {#each albums as album}
      <Book
        {album}
        items={titles}
        onclick={() => {
          goto(`/user/${page.params.uid}/album/${album.id}`);
        }}
      />
    {/each}
  </div>
{/if}
