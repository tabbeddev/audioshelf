<script lang="ts">
  import { ArrowLeftRight, BookAudio, Loader, Music, Pause, Play, SkipBack, SkipForward } from "@lucide/svelte";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { createAvatar } from "@dicebear/core";
  import { shapes } from "@dicebear/collection";
  import { goto } from "$app/navigation";
  import pkg from "@prisma/client";
  import { secondStringify } from "$lib/util";

  function onMessage(event: MessageEvent) {
    if (!player) return;

    const data: App.Notification | App.PlayRequest = event.data;
    if (data.type === "playAlbum") {
      console.log("PlayRequest receied:");
      console.log(data);

      doNotPlay = false;
      playAlbum({ albumid: data.albumid, position: data.position, titleid: data.starttitleid });
    }
  }

  function playCurrentTitle(position?: number) {
    if (!player) return console.warn("Player not ready");

    player.src = "/api/titles/" + currentTitle!.id;
    if (position) player.currentTime = position;
    player.load();

    document.title = `${currentTitle!.title} | ${currentTitle!.album}`;
  }

  async function playAlbum({ albumid, titleid, position }: { albumid: number; titleid?: number; position?: number }) {
    if (!player) return console.warn("Player not ready");
    currentAlbum = albumid;

    const response = await fetch("/api/albums/" + albumid);
    if (!response.ok) return;

    albumMetadata = await response.json();

    if (!titleid) titleid = queue[0];

    currentIndex = queue.indexOf(titleid);
    playCurrentTitle(position);
  }

  async function saveCurrentState() {
    if (!player && currentIndex !== undefined) return console.warn("Player not ready");

    const response = await fetch(`/api/users/${data.user.id}/playstate`, {
      method: "POST",
      body: JSON.stringify({
        albumid: currentAlbum,
        titleid: queue[currentIndex!],
        position: Math.round(player!.currentTime),
      }),
    });

    if (!response.ok) {
      postMessage({
        type: "warning",
        title: "Failed to save play state",
        subtitle: "You won't be able to resume your audiobook: " + (await response.text()),
      } as App.Notification);
      console.warn({
        albumid: currentAlbum,
        titleid: queue[currentIndex!],
        position: Math.round(player!.currentTime),
      });
    }
  }

  function seek(e: Event) {
    if (!player) return console.warn("Player not ready");

    const slider = e.target as HTMLInputElement;
    const newTime = Number(slider.value);

    player.currentTime = newTime;
  }

  enum State {
    Playing,
    Paused,
    Buffering,
  }

  const { children, data }: { data: LayoutData; children: Snippet } = $props();

  let isHovering = $state(false);

  let player: HTMLAudioElement | undefined = $state();

  // List of title ids;
  let albumMetadata: { name: string; discs: Record<string, pkg.Titles[]> } | undefined = $state();
  let queue: number[] = $derived(
    Object.values(albumMetadata?.discs ?? {})
      .flat()
      .map((v) => v.id),
  );
  let currentIndex: number | undefined = $state();
  let currentTitle = $derived(
    Object.values(albumMetadata?.discs ?? {})
      .flat()
      .find((v) => v.id === queue[currentIndex ?? 0]),
  );

  // Album id
  let currentAlbum: number | undefined = $state();

  // UI stuff
  let duration: number | undefined = $state();
  let currentTime: number | undefined = $state();

  let currentState = $state(State.Buffering);

  // Save timer
  let saveTimer: NodeJS.Timeout;
  let doNotPlay = $state(false);

  // Search
  let isSearching = $state(false);
  let searchTerm = $state("");

  onMount(() => {
    player = new Audio();
    player.addEventListener("durationchange", () => {
      duration = player!.duration;
    });

    player.addEventListener("timeupdate", () => {
      currentTime = player!.currentTime;
    });

    player.addEventListener("ended", () => {
      if (currentIndex === undefined) return;

      if (currentIndex - 1 !== queue.length) {
        currentIndex++;
        playCurrentTitle();
      }
    });

    player.addEventListener("waiting", () => {
      console.log(player!.currentTime);
      currentState = State.Buffering;
    });
    player.addEventListener("play", () => {
      currentState = State.Playing;

      saveTimer = setInterval(saveCurrentState, 5000);
    });
    player.addEventListener("pause", () => {
      currentState = State.Paused;

      saveCurrentState();
      clearInterval(saveTimer);
    });
    player.addEventListener("canplaythrough", () => {
      if (doNotPlay) {
        currentState = State.Paused;
      } else {
        currentState = State.Playing;
        player!.play();
      }
    });

    // Resume last audiobook

    const lastState = data.states.find((v) => v.lastplayed);
    doNotPlay = true;
    if (lastState) playAlbum(lastState);

    onDestroy(saveCurrentState);
  });
</script>

<svelte:window onmessage={onMessage} />

{#if isSearching}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed mt-14 w-screen h-screen top-0 left-0 px-6 pt-6 flex-col gap-2"
    style:background-color="rgba(0,0,0,75%)"
    onmouseleave={() => {
      isSearching = false;
    }}
  >
    <div class="secondbg">
      {#if searchTerm}
        <h1 class="text-2xl">Search results for: <span class="font-semibold">{searchTerm}</span></h1>
        <hr />
      {:else}
        <h1 class="text-2xl font-bold">Search for your favorite audiobooks or a title from one</h1>
      {/if}
    </div>
  </div>
{/if}

<main class="mt-16 mb-18 mx-2">
  {@render children()}
</main>

<div class="scnbg h-14 w-full fixed left-0 top-0 flex justify-center items-center">
  <div class="w-2/3 flex justify-center items-center">
    <p class="flex items-center gap-1 text-2xl fixed left-8">
      <BookAudio size="36" strokeWidth="1.25" />
      AudioShelf
    </p>
    <input
      type="text"
      placeholder="Search for your favorite books..."
      class="w-1/2!"
      onfocusin={() => {
        isSearching = true;
      }}
      onchange={() => {
        isSearching = true;
      }}
      bind:value={searchTerm}
    />
    <div class="flex gap-2 items-center text-xl fixed right-8">
      <button
        class="iconbtn sm secondary border-2 p-1.5! pl-2! text-xl!"
        title="Switch user"
        id="switch-btn"
        onmouseleave={() => {
          isHovering = false;
        }}
        onmouseenter={() => {
          isHovering = true;
        }}
        onclick={() => {
          goto("/");
        }}
      >
        {#if isHovering}
          <ArrowLeftRight />
          <span class="font-medium">Switch user</span>
        {:else}
          {data.user.username}
        {/if}
        {@html createAvatar(shapes, {
          seed: data.user.username,
          size: 36,
          radius: 8,
        }).toString()}
      </button>

      <a href={"/user/" + data.user.id}>Audiobooks</a>
    </div>
  </div>
</div>

<div class="playbg h-16 w-full fixed left-0 bottom-0 flex items-center justify-center">
  {#if !player}
    <p class="text-xl font-semibold">Loading...</p>
  {:else if queue.length > 0 && currentAlbum && albumMetadata && currentIndex !== undefined && currentTitle}
    <div class="fixed left-2">
      <p class="font-bold text-xl iconbtn">
        <Music size="20" />
        {currentTitle.title}
      </p>
      <a class="font-medium text-lg" href={`/user/${data.user.id}/album/${currentAlbum}`}>{currentTitle.album}</a>
    </div>

    <div class="flex gap-1 items-center">
      <button
        class="iconbtn sm"
        disabled={currentIndex === 0}
        onclick={() => {
          currentIndex!--;
          playCurrentTitle();
        }}
      >
        <SkipBack strokeWidth="1.5" />
      </button>
      <button
        class="iconbtn sm"
        onclick={() => {
          player!.paused ? ((doNotPlay = false), player!.play()) : player!.pause();
        }}
        disabled={currentState === State.Buffering}
      >
        {#if currentState === State.Paused}
          <Play size="32" strokeWidth="1.75" />
        {:else if currentState === State.Playing}
          <Pause size="32" strokeWidth="1.75" />
        {:else}
          <Loader size="32" strokeWidth="1.75" />
        {/if}
      </button>
      <button
        class="iconbtn sm"
        disabled={currentIndex - 1 === queue.length}
        onclick={() => {
          currentIndex!++;
          playCurrentTitle();
        }}
      >
        <SkipForward strokeWidth="1.5" />
      </button>
    </div>

    <div class="flex gap-2 items-center fixed right-2 justify-end">
      <span class="text-xl">{currentTime === undefined ? "--:--" : secondStringify(currentTime)}</span>
      <input type="range" class="w-[20vw]" max={Math.round(duration ?? 0)} value={currentTime ?? 0} onchange={seek} />
      <span class="text-xl">{duration === undefined ? "--:--" : secondStringify(duration)}</span>
    </div>
  {:else}
    <div class="text-center">
      <p class="text-xl font-semibold">Welcome to AudioShelf!</p>
      <p>Start by playing one of your Audiobook.</p>
    </div>
  {/if}
</div>
