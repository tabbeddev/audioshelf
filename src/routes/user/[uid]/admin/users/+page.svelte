<script lang="ts">
  import { CircleArrowDown, Trash2, UserPlus, Wrench } from "@lucide/svelte";
  import type { PageData } from "./$types";

  function createUser(event: SubmitEvent) {
    event.preventDefault();

    fetch("/api/users", { method: "POST", body: JSON.stringify({ username: name }) })
      .then(async (d) => {
        if (d.ok) {
          users.push({ id: -1, isadmin: false, username: name });
          name = "";
        } else {
          postMessage({ type: "error", title: "Failed to create user", subtitle: (await d.json()).message } as App.Notification);
        }
      })
      .catch(() => {
        postMessage({ type: "error", title: "Failed to create user", subtitle: "Internal error" } as App.Notification);
      });
  }

  function toggleAdmin(index: number) {
    const user = users[index];

    fetch("/api/users", { method: "PUT", body: JSON.stringify({ username: user.username, isadmin: !user.isadmin }) })
      .then(async (d) => {
        if (d.ok) {
          user.isadmin = !user.isadmin;
        } else {
          postMessage({ type: "error", title: "Failed to update user", subtitle: (await d.json()).message } as App.Notification);
        }
      })
      .catch(() => {
        postMessage({ type: "error", title: "Failed to update user", subtitle: "Internal error" } as App.Notification);
      });
  }

  function deleteUser(index: number) {
    const user = users[index];

    fetch("/api/users", { method: "DELETE", body: JSON.stringify({ username: user.username }) })
      .then(async (d) => {
        if (d.ok) {
          users.splice(index, 1);
        } else {
          postMessage({ type: "error", title: "Failed to delete user", subtitle: (await d.json()).message } as App.Notification);
        }
      })
      .catch(() => {
        postMessage({ type: "error", title: "Failed to delete user", subtitle: "Internal error" } as App.Notification);
      });
  }

  let name = $state("");

  const { data }: { data: PageData } = $props();

  const users = $state(data.users);
  let admins = $derived(users.filter((v) => v.isadmin));
</script>

<svelte:head>
  <title>Users | Admin Settings | AudioShelf</title>
</svelte:head>

<h1 class="text-3xl font-semibold">Users:</h1>

<hr />

{#each users as user, index}
  {@const preventDegradation = user.isadmin && admins.length === 1}
  <div class="flex max-md:flex-col justify-between md:items-center">
    <div class="iconbtn">
      <h1 class="text-lg font-medium">{user.username}</h1>
      {#if user.isadmin}
        <Wrench />
      {/if}
    </div>

    <div class="iconbtn">
      <button
        class="iconbtn"
        disabled={preventDegradation}
        title={preventDegradation ? "At least one admin must remain" : ""}
        onclick={() => {
          deleteUser(index);
        }}
      >
        <Trash2 size="20" />
        Delete user
      </button>
      <button
        class="iconbtn"
        disabled={preventDegradation}
        title={preventDegradation ? "At least one admin must remain" : ""}
        onclick={() => {
          toggleAdmin(index);
        }}
      >
        {#if user.isadmin}
          <CircleArrowDown />
          Degrade to user
        {:else}
          <Wrench size="20" />
          Promote to admin
        {/if}
      </button>
    </div>
  </div>
  <hr />
{/each}

<h2 class="text-3xl font-semibold mb-2">Create User:</h2>

<form onsubmit={createUser}>
  <label for="name">Name:</label>
  <input bind:value={name} type="text" id="name" />

  <button class="iconbtn mt-1" type="submit" disabled={!name}>
    <UserPlus />
    Create user
  </button>
</form>
