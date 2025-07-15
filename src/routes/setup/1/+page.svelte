<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserPlus } from "@lucide/svelte";

  let username = $state("");
  let pending = $state(false);

  async function createUser(event: SubmitEvent) {
    event.preventDefault();
    pending = true;

    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({
        username,
        isadmin: true,
      }),
    });

    pending = false;

    if (response.ok) {
      goto("/setup/2");
    } else {
      postMessage({ type: "error", title: "Failed to create user", subtitle: (await response.json()).message } as App.Notification);
    }
  }
</script>

<div class="-translate-1/2 absolute left-1/2 top-1/2 secondbg">
  <p class="text-3xl font-light">1. Create your user</p>
  <p>You will now have to create your first user, which also will be the admin.</p>

  <form onsubmit={createUser}>
    <input type="text" placeholder="Username" bind:value={username} required />
    <hr />
    <button type="submit" class="iconbtn" disabled={pending}>
      <UserPlus />
      Create User
    </button>
  </form>
</div>
