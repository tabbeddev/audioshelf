<script lang="ts">
  import { getArtistsOfAlbum } from "$lib/albumUtil";
  import Book from "./book.svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { MediaQuery } from "svelte/reactivity";
  import Cover from "./cover.svelte";
  import { BookAudio, type IconProps } from "@lucide/svelte";
  import type { Component } from "svelte";

  const { albums, notfound }: { albums: Data.Album[]; notfound: { title: string; subtitle: string; icon: Component<IconProps> } } =
    $props();
</script>

{#if albums.length === 0}
  <div class="flex items-center gap-3">
    <notfound.icon size="48" strokeWidth="1.5" />
    <div>
      <h1 class="text-2xl font-semibold">{notfound.title}</h1>
      <p>{notfound.subtitle}</p>
    </div>
  </div>
{:else}
  <div class="overflow-x-scroll w-full flex p-2 mb-2 gap-2 max-md:flex-col">
    {#each albums as album}
      {#snippet titles()}
        <span class="w-64 font-semibold">{album.name}</span>
        <span class="w-64 font-light">
          <span class="sr-only">by </span>
					{getArtistsOfAlbum(album.titles)}
				</span>
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
