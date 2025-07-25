<script lang="ts">
  import { shapes } from "@dicebear/collection";
  import { createAvatar } from "@dicebear/core";
  import type { PageData } from "./$types";
  import { BookAudio, CircleAlert, Wrench } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { MediaQuery } from "svelte/reactivity";
  import { onMount } from "svelte";
  import { version } from "$app/environment";

  const { data }: { data: PageData } = $props();
  let isMedium = $state(false);
  let missingAllowInsecure = $state(false);

  onMount(() => {
    const medium = new MediaQuery("width >= 48rem", true);
    $effect(() => {
      isMedium = medium.current;
    });

    missingAllowInsecure = !("caches" in window);
  });
</script>

<svelte:head>
	<title>AudioShelf</title>
</svelte:head>

<div class="-translate-1/2 top-1/5 left-1/2 absolute flex items-center gap-1 text-5xl font-light opacity-15 md:text-8xl">
  <BookAudio size={isMedium ? 128 : 72} strokeWidth="1.25" />
  AudioShelf
</div>

<div class="-translate-y-1/2 absolute top-1/2 text-center w-screen">
  <p class="font-medium text-3xl md:text-4xl lg:text-5xl">Who's listening today?</p>

  <div class="flex max-md:flex-col gap-2 items-center justify-center">
    {#each data.users as user}
      <button
        class="max-md:w-[90vw] flex md:flex-col items-center gap-2 secondary"
        onclick={() => {
          goto("/user/" + user.id);
        }}
      >
        {@html createAvatar(shapes, {
          seed: user.username,
          size: isMedium ? 128 : 64,
          radius: 8,
        }).toString()}

        <p class="text-2xl font-medium iconbtn">
          {user.username}
          {#if user.isadmin}
            <Wrench />
          {/if}
        </p>
      </button>
    {/each}
  </div>

  <p class="text-center mt-4">An admin can add new users in the admin settings</p>

  {#if missingAllowInsecure}
    <div class="flex justify-center">
      <p class="iconbtn mt-4 text-2xl font-semibold">
        <CircleAlert size="32" />
        You're not set up for offline use
      </p>
    </div>

    <p>You won't be able to access this app, while being offline.</p>
    <p>This includes playing your downloaded audiobooks.</p>
    <p>See the FAQ for more info.</p>
  {/if}
</div>

<footer class="fixed bottom-2 left-1/2 -translate-x-1/2">
  <span class="opacity-65 text-nowrap">
    <a class="text-blue-200" href="https://github.com/tabbeddev/audioshelf" target="_blank">AudioShelf</a>
    v{version}
    by
    <a class="text-blue-200" href="https://github.com/tabbeddev" target="_blank">tabbeddev</a>
  </span>
</footer>
