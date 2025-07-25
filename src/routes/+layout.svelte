<script lang="ts">
  import "../app.css";
  import { onMount, type Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { page, navigating, updated } from "$app/state";
  import { redirect } from "@sveltejs/kit";
  import { Check, CircleX, Info, Loader, TriangleAlert, X } from "@lucide/svelte";
  import { fade, slide } from "svelte/transition";
  import { onNavigate } from "$app/navigation";
  import { version } from "$app/environment";

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
      }, 250);
    } else {
      loading = false;
      clearTimeout(loadingTimeout);
    }
  });

  // Transitions

  onNavigate(() => {
    if (!document.startViewTransition) return console.warn("StartViewTransition not found");

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigating.complete;
      });
    });
  });

  // Has updated check

  let hasUpdated = $state(false);

  onMount(() => {
    const lastKnownVersion = localStorage.getItem("lastKnownVersion");
    if (lastKnownVersion && lastKnownVersion !== version) {
      hasUpdated = true;
      console.log("AudioShelf was updated");
    }
    localStorage.setItem("lastKnownVersion", version);
  });
</script>

<svelte:window {onmessage} />

<div aria-hidden={hasUpdated}>
  {@render children()}
</div>

<div class="right-0 bottom-0 fixed p-2 flex flex-col-reverse gap-1 z-30" style:view-transition-name="noti-box">
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
  <div
    class="fixed left-0 top-0 w-screen h-screen flex items-center justify-center"
    style:background-color="rgba(23, 33, 39, 75%)"
    style:view-transition-name="loading-overlay"
  >
    <div class="flex items-center gap-2 text-2xl">
      <Loader size="40" class="animate-spin" />
      Loading ...
    </div>
  </div>
{/if}

{#if hasUpdated}
  <div transition:fade aria-hidden="true" class="fixed top-0 left-0 opacity-75 bg-black w-screen h-screen z-40"></div>
  <div transition:fade class="secondbg fixed left-1/2 top-1/2 -translate-1/2 z-50 text-center" role="dialog">
    <p class="text-2xl font-bold mb-2">Hooray! AudioShelf&nbsp;was&nbsp;updated!</p>
    <p class="text-xl font-medium mb-4">You're now on {version}.</p>
    <p>
      The changelog can be found on the
      <a class="text-blue-200" target="_blank" href="https://github.com/tabbeddev/audioshelf"> GitHub of AudioShelf </a>.
    </p>

    <div class="flex justify-center mt-4">
      <button
        class="iconbtn"
        onclick={() => {
          hasUpdated = false;
        }}
      >
        <Check />
        Close
      </button>
    </div>
  </div>
{/if}
