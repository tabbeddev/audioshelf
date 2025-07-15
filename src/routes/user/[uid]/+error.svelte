<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Home } from "@lucide/svelte";
  import type { LayoutData } from "./$types";

  const { data }: { data: LayoutData } = $props();
</script>

<div class="left-1/2 top-1/2 -translate-1/2 absolute flex flex-col items-center">
  <h1 class="font-light text-8xl p-2 pt-0 border-b-2">{page.status}</h1>
  <p class="text-2xl my-2">{page.error?.message}</p>

  <button
    class="iconbtn"
    onclick={() => {
      goto("/user/" + data.user.id);
    }}
  >
    <Home />
    Go home
  </button>
</div>
