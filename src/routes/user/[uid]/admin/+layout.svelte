<script lang="ts">
  import { page } from "$app/state";
  import { Package, Users } from "@lucide/svelte";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { goto } from "$app/navigation";

  const { children, data }: { children: Snippet; data: LayoutData } = $props();
  const rootPath = `/user/${data.user.id}/admin/`;
</script>

<div class="flex gap-4">
  <div class="flex flex-col gap-1 border-r-2 p-2 pr-4 shrink-0">
    <span class="text-3xl font-medium">Admin Settings</span>

    <button class:secondary={!page.route.id?.endsWith("/admin")} class="iconbtn" onclick={() => goto(rootPath)}>
      <Package />
      Libraries
    </button>

    <button class:secondary={!page.route.id?.endsWith("/admin/users")} class="iconbtn" onclick={() => goto(rootPath + "users")}>
      <Users />
      Users
    </button>
  </div>

  <div class="w-full">
    {@render children()}
  </div>
</div>
