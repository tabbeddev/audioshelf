<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { fade } from "svelte/transition";

  const { value, content, duration = 200 }: { value: any; content: Snippet; duration?: number } = $props();
  let shown = $state(true);

  let container = $state<HTMLDivElement>();

  // @ts-ignore
  $effect.pre(async () => {
    value;

    shown = false;
    await tick();

    await new Promise<void>((resolve) => {
      if (!container) return resolve();
      const handler = () => {
        container?.removeEventListener("outroend", handler);
        resolve();
      };
      container.addEventListener("outroend", handler);
    });

    shown = true;
  });
</script>

{#if shown}
  <div bind:this={container} transition:fade={{ duration }}>
    {@render content()}
  </div>
{/if}
