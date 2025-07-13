<script lang="ts">
  import { BookAudio } from "@lucide/svelte";
  import type { Component } from "svelte";

  const { Icon }: { Icon: Component } = $props();
</script>

<div class="scnbg h-64 w-64 p-2 rounded-xl flex justify-center items-center">
  <!-- TODO: Use real cover -->
  <Icon size="128" strokeWidth="1" />
</div>
