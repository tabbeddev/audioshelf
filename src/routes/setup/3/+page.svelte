<script lang="ts">
  import { ChevronRight } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  const { data }: { data: PageData } = $props();
  let scrapeRequest: Promise<Response> | undefined = $state();

  onMount(() => {
    scrapeRequest = fetch("/api/libraries/update", { method: "POST", body: JSON.stringify({ rebuild: true }) });
    scrapeRequest
      .then(async (d) => {
        if (!d.ok) postMessage({ type: "error", title: "Failed to index the library", subtitle: await d.text() } as App.Notification);
      })
      .catch(() => {
        postMessage({ type: "error", title: "Failed to index the library", subtitle: "Internal error" } as App.Notification);
      });
  });
</script>

<div class="-translate-1/2 absolute left-1/2 top-1/2 secondbg">
  {#await scrapeRequest}
    <p class="text-3xl font-light">Updating all libraries</p>
    <p>All libraries are currently being updated. Please wait...</p>
  {:then}
    <p class="text-3xl font-light">You're ready to go!</p>
    <hr />
    <button
      type="submit"
      class="iconbtn"
      onclick={() => {
        goto("/");
      }}
    >
      <ChevronRight />
      Open AudioShelf
    </button>
  {/await}
</div>
