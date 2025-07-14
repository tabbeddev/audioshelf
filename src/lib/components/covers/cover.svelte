<script lang="ts">
  import type { Component } from "svelte";

  const { Icon, size = 128, strokeWidth = 1 }: { Icon: Component; size?: number; strokeWidth?: number } = $props();
</script>

<div class="scnbg p-2 rounded-xl flex justify-center items-center" style:width={size / 8 + "rem"} style:height={size / 8 + "rem"}>
  <!-- TODO: Use real cover -->
  <Icon {size} {strokeWidth} />
</div>
