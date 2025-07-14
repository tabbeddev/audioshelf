<script lang="ts">
  import { PackagePlus, RefreshCw, Search, Trash2 } from "@lucide/svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const { libraries } = data;

  let name = $state("");
  let path = $state("");

  function deleteLibrary(index: number) {
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

  function updateLibraries(rebuild: boolean) {
    fetch("/api/libraries/update", { method: "POST", body: JSON.stringify({ rebuild }) })
      .then(async (d) => {
        if (d.ok)
          postMessage({
            type: "notification",
            title: "Libraries updated",
            subtitle: rebuild ? "All files were updated" : "New files were added to the database",
          } as App.Notification);
        else postMessage({ type: "error", title: "Failed to update all libraries", subtitle: await d.text() } as App.Notification);
      })
      .catch(() => {
        postMessage({ type: "error", title: "Failed to update all libraries", subtitle: "Internal error" } as App.Notification);
      });
  }
</script>

<p class="text-3xl font-semibold">Libraries:</p>

<div class="flex gap-1">
  <button
    class="iconbtn mt-1"
    onclick={() => {
      updateLibraries(false);
    }}
  >
    <Search />
    Search for new files
  </button>

  <button
    class="iconbtn mt-1 secondary"
    title="Update all files in all libraries. WARNING: This will cause some problems and take a while."
    onclick={() => {
      updateLibraries(true);
    }}
  >
    <RefreshCw />
    Reindex Libraries
  </button>
</div>

<hr />

{#if libraries.length === 0}
  <p class="text-center text-2xl font-medium">No library created.</p>
  <hr />
{:else}
  {#each libraries as lib, index}
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-lg font-medium">{lib.name}</h1>
        <p class="italic">{lib.path}</p>
      </div>
      <button class="iconbtn" onclick={() => deleteLibrary(index)}>
        <Trash2 size="20" />
        Delete library
      </button>
    </div>
    <hr />
  {/each}
{/if}

<p class="text-3xl font-semibold mb-2">Create Library:</p>

<form onsubmit={createLibrary}>
  <label for="name">Name:</label>
  <input bind:value={name} type="text" id="name" />
  <label for="path">Path:</label>
  <input bind:value={path} type="text" id="path" />

  <button class="iconbtn mt-1" type="submit" disabled={!(name && path)}>
    <PackagePlus />
    Add library
  </button>
</form>
