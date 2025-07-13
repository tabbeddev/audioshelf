<script lang="ts">
  import { shapes } from "@dicebear/collection";
  import { createAvatar } from "@dicebear/core";
  import type { PageData } from "./$types";
  import { BookAudio, Wrench } from "@lucide/svelte";
  import { goto } from "$app/navigation";

  const { data }: { data: PageData } = $props();
</script>

<div class="-translate-1/2 top-1/5 left-1/2 absolute flex items-center gap-1 text-8xl font-light opacity-15">
  <BookAudio size="128" strokeWidth="1.25" />
  AudioShelf
</div>

<div class="-translate-1/2 absolute left-1/2 top-1/2 flex flex-col items-center gap-1">
  <p class="font-medium text-5xl">Who's listening today?</p>
  {#each data.users as user}
    <button
      class="container secondary"
      onclick={() => {
        goto("/user/" + user.id);
      }}
    >
      {@html createAvatar(shapes, {
        seed: user.username,
        size: 128,
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
