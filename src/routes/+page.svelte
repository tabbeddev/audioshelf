<script lang="ts">
  import { shapes } from "@dicebear/collection";
  import { createAvatar } from "@dicebear/core";
  import type { PageData } from "./$types";
  import { BookAudio, Wrench } from "@lucide/svelte";
  import { goto } from "$app/navigation";
    import { MediaQuery } from "svelte/reactivity";

  const { data }: { data: PageData } = $props();

	const medium = new MediaQuery("width >= 48rem");
</script>

<div class="-translate-1/2 top-1/5 left-1/2 absolute flex items-center gap-1 text-5xl font-light opacity-15 md:text-8xl">
  <BookAudio size={medium.current ? 128 : 72} strokeWidth="1.25" />
  AudioShelf
</div>

<div class="-translate-y-1/2 absolute top-1/2 text-center w-screen">
  <p class="font-medium text-3xl md:text-4xl lg:text-5xl">Who's listening today?</p>

  <div class="flex max-md:flex-col gap-2 items-center justify-center">
    {#each data.users as user}
      <button
        class="w-fit flex md:flex-col items-center gap-2 secondary"
        onclick={() => {
          goto("/user/" + user.id);
        }}
      >
        {@html createAvatar(shapes, {
          seed: user.username,
          size: medium.current ? 128 : 64,
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
</div>
