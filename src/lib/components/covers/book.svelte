<script lang="ts">
  import type { Snippet } from "svelte";
  import Cover from "./cover.svelte";
  import { BookAudio, BookOpen, Play } from "@lucide/svelte";

  const {
    album,
    items,
    onclick,
    hoverPlay = false,
  }: { album: Data.Album; items: Snippet<[Data.Album]>; onclick: () => void; hoverPlay?: boolean } = $props();

  let hovering = $state(false);
</script>

<button
  class="secondary flex flex-col gap-1 mb-1.5 shrink-0 rounded-r-none!"
  {onclick}
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => {
    hovering = false;
  }}
>
  <Cover Icon={hovering ? (hoverPlay ? Play : BookOpen) : BookAudio} />
  {@render items(album)}
</button>

<style>
  button {
    box-shadow: 0px 1rem rgb(63, 73, 89);
  }
</style>
