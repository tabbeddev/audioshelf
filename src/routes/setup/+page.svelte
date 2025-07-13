<script lang="ts">
  import { goto } from "$app/navigation";
  import { ChevronRight } from "@lucide/svelte";
</script>

<div class="-translate-1/2 absolute left-1/2 top-1/2 secondbg">
  <p class="text-3xl font-light">Welcome to AudioShelf!</p>
  <p>Thank you for trying AudioShelf.<br />This guide will help setting up your AudioShelf instance.</p>

  <hr />

  <button
    class="iconbtn mt-1"
    onclick={() => {
      goto("/setup/1");
    }}
  >
    <ChevronRight />
    Next
  </button>
</div>
