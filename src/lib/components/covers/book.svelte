<script lang="ts">
  import type { Snippet } from "svelte";
  import Cover from "./cover.svelte";
  import { BookAudio, BookOpen, Play } from "@lucide/svelte";

  const {
    items,
    onclick,
    hoverPlay = false,
    disabled = false,
  }: {
    items: Snippet;
    onclick: () => void;
    hoverPlay?: boolean;
    disabled?: boolean;
  } = $props();

  let hovering = $state(false);
</script>

<button
  class="secondary flex flex-col gap-1 mb-1.5 shrink-0 rounded-r-none!"
  {onclick}
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => {
    hovering = false;
  }}
  {disabled}
>
  <Cover Icon={hovering && !disabled ? (hoverPlay ? Play : BookOpen) : BookAudio} />
  {@render items()}
</button>

<style>
  button {
    box-shadow: 0px 1rem rgb(63, 73, 89);
  }
</style>
