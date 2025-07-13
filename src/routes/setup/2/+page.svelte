<script lang="ts">
  import { ChevronRight, PackagePlus, Trash2 } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";

  const { data }: { data: PageData } = $props();
  const libraries = $state(data.libraries);

  let name = $state("");
  let path = $state("");

  function deleteLibrary(index: number) {
    const name = libraries[index].name;

    fetch("/api/libraries/delete", { method: "POST", body: JSON.stringify({ name }) })
      .then(async (d) => {
        if (d.ok) {
          libraries.splice(index, 1);

          postMessage({
            type: "notification",
            title: "Library deleted",
            subtitle: `The library "${name}" was deleted successfully. The files will still remain.`,
          } as App.Notification);
        } else {
          postMessage({ type: "error", title: "Failed to delete Library", subtitle: (await d.json()).message } as App.Notification);
        }
      })
      .catch((e) => {
        postMessage({ type: "error", title: "Failed to delete Library", subtitle: e } as App.Notification);
      });
  }

  function createLibrary(event: SubmitEvent) {
    event.preventDefault();

    fetch("/api/libraries/create", { method: "POST", body: JSON.stringify({ name, path }) })
      .then(async (d) => {
        if (d.ok) {
          postMessage({
            type: "notification",
            title: "Library created",
            subtitle: `The library "${name}" was created successfully.`,
          } as App.Notification);

          libraries.push({ name, path });
          name = "";
          path = "";
        } else {
          postMessage({
            type: "error",
            title: "Failed to create Library",
            subtitle: (await d.json()).message,
          } as App.Notification);
        }
      })
      .catch((e) => {
        postMessage({ type: "error", title: "Failed to delete Library", subtitle: e } as App.Notification);
      });
  }
</script>

<div class="-translate-1/2 absolute left-1/2 top-1/2 secondbg">
  <p class="text-3xl font-light">2. Add your books</p>
  <p>You may now add the path to your audiobook library.</p>

  <hr />

  {#if libraries.length === 0}
    <span class="text-xl font-bold">No libraries found.</span>
  {:else}
    {#each libraries as lib, index}
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-lg font-medium">{lib.name}</h1>
          <p class="italic">{lib.path}</p>
        </div>
        <button class="iconbtn" onclick={() => deleteLibrary(index)}>
          <Trash2 size="20" />
        </button>
      </div>
    {/each}
  {/if}

  <hr />

  <form onsubmit={createLibrary}>
    <label for="name">Name:</label>
    <input bind:value={name} type="text" id="name" />
    <label for="path">Path:</label>
    <input bind:value={path} type="text" id="path" />

    <hr />

    <div class="flex gap-1">
      <button class="iconbtn mt-1" type="submit">
        <PackagePlus />
        Add library
      </button>

      <button
        class="iconbtn mt-1"
        type="button"
        onclick={() => {
          goto("/setup/3");
        }}
      >
        <ChevronRight />
        Next
      </button>
    </div>
  </form>
</div>
