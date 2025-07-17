<script lang="ts">
  import { getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "./book.svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { MediaQuery } from "svelte/reactivity";
  import Cover from "./cover.svelte";
  import { BookAudio } from "@lucide/svelte";

  const { albums, notfound }: { albums: Data.Album[], notfound: {title: string, subtitle: string} } = $props();
</script>

{#if albums.length === 0}
  <p class="lg:text-center font-bold text-2xl">{notfound.title}</p>
  <p class="lg:text-center text-xl">{notfound.subtitle}</p>
{:else}
  <div class="overflow-x-scroll w-full flex p-2 mb-2 gap-2 max-md:flex-col">
    {#each albums as album}
      {#snippet titles()}
        <span class="w-64 font-semibold">{album.name}</span>
        <span class="w-64 font-light">{getArtistsOfAlbum(album.titles)}</span>
      {/snippet}

      {#if new MediaQuery("width >= 48rem").current}
        <Book
          items={titles}
          onclick={() => {
            goto(`/user/${page.params.uid}/album/${album.id}`);
          }}
        />
      {:else}
        <button
          class="iconbtn text-left secondary"
          onclick={() => {
            goto(`/user/${page.params.uid}/album/${album.id}`);
          }}
        >
          <Cover Icon={BookAudio} size={24} />
          <div>
            <p class="font-semibold">{album.name}</p>
            <p>{getArtistsOfAlbum(album.titles)}</p>
          </div>
        </button>
      {/if}
    {/each}
  </div>
{/if}
