<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { page, navigating } from "$app/state";
  import { redirect } from "@sveltejs/kit";
  import { CircleX, Info, Loader, TriangleAlert, X } from "@lucide/svelte";
  import { fade, slide } from "svelte/transition";

  const { data, children }: { data: LayoutData; children: Snippet<[]> } = $props();
  let notification: App.Notification[] = $state([]);

  if (page.route.id?.startsWith("/setup")) {
    if (data.users !== 0) {
      redirect(307, "/");
    }
  } else {
    if (data.users === 0) {
      redirect(307, "/setup");
    }
  }

  function onmessage(e: MessageEvent) {
    const data: App.Notification | App.PlayRequest = e.data;

    if (data.type === "playAlbum") return;

    if (data.subtitle && data.title && data.type) notification.push(data);
  }

  let loading = $state(false);
  let loadingTimeout: NodeJS.Timeout;

  $effect(() => {
    if (navigating.to) {
      loadingTimeout = setTimeout(() => {
        loading = true;
      }, 500);
    } else {
      loading = false;
      clearTimeout(loadingTimeout);
    }
  });
</script>

<svelte:window {onmessage} />
<svelte:head>
  <title>AudioShelf</title>
</svelte:head>

{@render children()}

<div class="right-0 bottom-0 fixed p-2 flex flex-col-reverse gap-1">
  {#each notification as not, index}
    <div transition:slide>
      <div class="not-bg" out:fade>
        <div class="flex justify-between">
          <h1 class="text-xl font-semibold iconbtn">
            {#if not.type === "error"}
              <CircleX />
            {:else if not.type === "notification"}
              <Info />
            {:else if not.type === "warning"}
              <TriangleAlert />
            {/if}
            {not.title}
          </h1>
          <button class="iconbtn sm ml-12" onclick={() => notification.splice(index, 1)}>
            <X size="20" />
          </button>
        </div>
        <hr />
        <p>{not.subtitle}</p>
      </div>
    </div>
  {/each}
</div>

{#if loading}
  <div class="fixed left-0 top-0 w-screen h-screen flex items-center justify-center" style="background-color: rgba(23, 33, 39, 75%);">
    <div class="flex items-center gap-2 text-2xl">
      <Loader size="40" class="animate-spin" />
      Loading ...
    </div>
  </div>
{/if}
