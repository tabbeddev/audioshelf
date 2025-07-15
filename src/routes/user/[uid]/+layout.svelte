<script lang="ts">
  import {
    ArrowLeftRight,
    BookAudio,
    ChevronDown,
    ChevronUp,
    Loader,
    Music,
    Pause,
    Play,
    Search,
    SkipBack,
    SkipForward,
    Wrench,
    Repeat,
    Repeat1,
    ArrowRightToLine,
  } from "@lucide/svelte";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { createAvatar } from "@dicebear/core";
  import { shapes } from "@dicebear/collection";
  import { goto } from "$app/navigation";
  import pkg from "@prisma/client";
  import { secondStringify } from "$lib/util";
  import Cover from "$lib/components/covers/cover.svelte";
  import { getArtistsOfAlbum, getGenresOfAlbum } from "$lib/albumUtil";
  import { MediaQuery } from "svelte/reactivity";

  function onMessage(event: MessageEvent) {
    if (!player) return;

    const data: App.Notification | App.PlayRequest = event.data;
    if (data.type === "playAlbum") {
      doNotPlay = false;
      playAlbum({ albumid: data.albumid, position: data.position, titleid: data.starttitleid });
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.code === "Escape" && isSearching) isSearching = false;

    if (event.code === "KeyF" && event.shiftKey && !isSearching) {
      event.preventDefault();
      isSearching = true;
      (document.getElementById("globalsearch")! as HTMLInputElement).focus();
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
    if (!(player && currentIndex !== undefined && queue.length !== 0 && currentAlbum !== undefined))
      return console.warn("Player not ready");

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

  function toggleRepeat() {
    repeating++;
    if (repeating === 3) repeating = 0;
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

  // Play
  let isPoppedUp = $state(false);
  let repeating = $state(0);

  const large = new MediaQuery("width >= 64rem");

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

      if (repeating === 2) {
        playCurrentTitle();
      } else if (currentIndex + 1 !== queue.length) {
        currentIndex++;
        playCurrentTitle();
      } else {
        if (repeating === 1) {
          currentIndex = 0;
          playCurrentTitle();
        } else {
          fetch(`/api/users/${data.user.id}/playstate`, {
            method: "DELETE",
            body: JSON.stringify({ userid: data.user.id, albumid: currentAlbum }),
          })
            .then(async (d) => {
              if (!d.ok)
                postMessage({
                  type: "warning",
                  title: "Failed to delete savestate",
                  subtitle: (await d.json()).message,
                } as App.Notification);
            })
            .catch(() => {
              postMessage({ type: "warning", title: "Failed to delete savestate", subtitle: "Request error" } as App.Notification);
            });
        }
      }
    });

    player.addEventListener("loadstart", () => {
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

<svelte:window onmessage={onMessage} {onkeydown} />

{#if isPoppedUp && !(isSearching && searchTerm) && player && queue.length > 0 && currentAlbum && albumMetadata && currentIndex !== undefined && currentTitle}
  <!-- Fullscreen Player -->
  <div class="fixed mt-14 w-screen top-0 left-0 p-2 semiplaybg flex flex-col justify-center z-20" style:height="calc(100vh - 3.5rem)">
    <div class="flex max-md:flex-col items-center md:justify-center gap-4">
      <Cover Icon={BookAudio} />
      <div class="max-md:text-center flex flex-col max-md:items-center w-full md:w-3/5">
        <p class="text-xl font-semibold">{currentTitle.title}</p>
        <p class="text-xl">{currentTitle.artist}</p>
        <a
          class="font-medium my-2 text-lg"
          href={`/user/${data.user.id}/album/${currentAlbum}`}
          onclick={() => {
            isPoppedUp = false;
          }}>{currentTitle.album}</a
        >
        <input type="range" class="max-md:w-11/12 mt-2" max={Math.round(duration ?? 0)} value={currentTime ?? 0} onchange={seek} />

        <div class="flex gap-2 justify-between max-md:w-11/12 text-lg">
          <span>{currentTime === undefined ? "--:--" : secondStringify(currentTime)}</span>
          <span>{duration === undefined ? "--:--" : secondStringify(duration)}</span>
        </div>

        <div class="flex gap-1 items-center max-md:justify-center">
          <button class="iconbtn sm mr-2" onclick={toggleRepeat} class:secondary={repeating === 0}>
            {#if repeating === 0}
              <ArrowRightToLine strokeWidth="1.5" size="32" />
            {:else if repeating === 1}
              <Repeat strokeWidth="1.5" size="32" />
            {:else}
              <Repeat1 strokeWidth="1.5" size="32" />
            {/if}
          </button>

          <button
            class="iconbtn sm"
            disabled={currentIndex === 0}
            onclick={() => {
              currentIndex!--;
              playCurrentTitle();
            }}
          >
            <SkipBack strokeWidth="1.5" size="40" fill="currentColor" />
          </button>

          <button
            class="iconbtn sm"
            onclick={() => {
              player!.paused ? ((doNotPlay = false), player!.play()) : player!.pause();
            }}
            disabled={currentState === State.Buffering}
          >
            {#if currentState === State.Paused}
              <Play size="48" strokeWidth="1.75" fill="currentColor" />
            {:else if currentState === State.Playing}
              <Pause size="48" strokeWidth="1.75" fill="currentColor" />
            {:else}
              <Loader size="48" strokeWidth="1.75" class="animate-spin" />
            {/if}
          </button>

          <button
            class="iconbtn sm"
            disabled={currentIndex + 1 === queue.length}
            onclick={() => {
              currentIndex!++;
              playCurrentTitle();
            }}
          >
            <SkipForward strokeWidth="1.5" size="40" fill="currentColor" />
          </button>

          <button
            class="ml-2 iconbtn sm secondary"
            onclick={() => {
              isPoppedUp = false;
            }}
          >
            <ChevronDown strokeWidth="1.5" size="32" />
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
{#if isSearching && searchTerm}
  <!-- Search box -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed mt-14 w-screen top-0 left-0 px-6 pt-6 flex flex-col gap-6 overflow-scroll z-20"
    style:background-color="rgba(0,0,0,75%)"
    style:height="calc(100vh - {isPoppedUp && !(isSearching && searchTerm) ? 3.5 : 7.5}rem)"
    onclick={() => {
      isSearching = false;
    }}
  >
    <div class="secondbg">
      <h1 class="text-2xl iconbtn">
        <Search />
        <p>Search results for: <span class="font-semibold">{searchTerm}</span></p>
      </h1>
    </div>
    {#await fetch("/api/search?q=" + searchTerm)}
      <div class="secondbg">
        <p>Searching...</p>
      </div>
    {:then response}
      {#await response.json()}
        <div class="secondbg">
          <p>Loading...</p>
        </div>
      {:then json: Data.SearchResult}
        <div class="secondbg">
          <h1 class="text-2xl font-semibold">Albums:</h1>
          <hr />
          {#if json.albums.length === 0}
            <p class="text-xl">No search results found.</p>
          {:else}
            {#each json.albums.slice(0, 10).toSorted((a, b) => a.name.localeCompare(b.name)) as album}
              <button
                class="secondary flex gap-2 items-center w-full text-left"
                onclick={() => {
                  goto(`/user/${data.user.id}/album/${album.id}`);
                  searchTerm = "";
                }}
              >
                <Cover Icon={BookAudio} size={24} strokeWidth={1.5} />
                <div class="flex sm:gap-2 max-sm:flex-col">
                  <span class="font-semibold">{album.name}</span>
                  {/* @ts-ignore */ null}
                  <span>({getGenresOfAlbum(album)}) by {getArtistsOfAlbum(album)} ({album._count.titles} titles)</span>
                </div>
              </button>
            {/each}
          {/if}
        </div>

        <div class="secondbg">
          <h1 class="text-2xl font-semibold">Titles:</h1>
          <hr />
          {#if json.titles.length === 0}
            <p class="text-xl">No search results found.</p>
          {:else}
            {#each json.titles.slice(0, 15).toSorted((a, b) => a.title.localeCompare(b.title)) as title}
              <button
                class="secondary flex gap-2 items-center w-full text-left"
                onclick={() => {
                  postMessage({ type: "playAlbum", albumid: title.album_entry.id, starttitleid: title.id } as App.PlayRequest);
                  searchTerm = "";
                }}
              >
                <Cover Icon={Music} size={16} strokeWidth={1.75} />
                <div class="flex sm:gap-2 max-sm:flex-col">
                  <span class="font-semibold">{title.title}</span>
                  <span>({title.album}) by {title.artist} [{secondStringify(title.length)}]</span>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      {/await}
    {/await}
  </div>
{/if}

<main class="mt-16 mb-18 mx-2">
  {@render children()}
</main>

<!-- Navbar -->
<div class="scnbg h-14 w-full fixed left-0 top-0 flex justify-between gap-2 items-center">
  <p class="hidden items-center gap-1 text-2xl ml-4 lg:flex">
    <BookAudio size="36" strokeWidth="1.25" />
    AudioShelf
  </p>

  <div class="flex items-center gap-1 max-lg:ml-4 max-md:w-full lg:fixed lg:left-1/2 lg:-translate-x-1/2">
    <Search size="32" class="max-sm:hidden" />
    <input
      type="text"
      placeholder="{large.current ? '[Shift + F] ' : ''}Search for your favorite books..."
      id="globalsearch"
      class="2xl:w-2xl! md:w-96!"
      onfocusin={() => {
        isSearching = true;
      }}
      onchange={() => {
        isSearching = true;
      }}
      bind:value={searchTerm}
    />
  </div>

  <div class="flex gap-0.5 lg:gap-2 items-center text-xl mr-4">
    <button
      class="iconbtn sm secondary p-1.5! lg:pl-2! text-xl!"
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
        {#if large.current}
          <p class="font-medium">Switch user</p>
        {/if}

        <ArrowLeftRight size="36" strokeWidth="1.5" />
      {:else}
        {#if large.current}
          <p>{data.user.username}</p>
        {/if}

        {@html createAvatar(shapes, {
          seed: data.user.username,
          size: 36,
          radius: 8,
        }).toString()}
      {/if}
    </button>

    <button
      onclick={() => {
        goto("/user/" + data.user.id);
      }}
      title="Show all Audiobooks"
      class="sm iconbtn secondary p-1.5!"
    >
      <BookAudio size="36" strokeWidth="1.5" />
    </button>

    {#if data.user.isadmin}
      <button
        onclick={() => {
          goto(`/user/${data.user.id}/admin`);
        }}
        title="Open Admin Settings"
        class="sm iconbtn secondary p-1.5!"
      >
        <Wrench size="36" strokeWidth="1.5" />
      </button>
    {/if}
  </div>
</div>

{#if !isPoppedUp || (isSearching && searchTerm)}
  <!-- Play bar -->
  <div class="playbg h-16 w-full fixed left-0 bottom-0 flex items-center justify-between px-2 overflow-hidden">
    {#if !player}
      <p class="text-xl font-semibold">Loading...</p>
    {:else if queue.length > 0 && currentAlbum && albumMetadata && currentIndex !== undefined && currentTitle}
      <div>
        <p class="font-medium md:font-bold text-xl iconbtn">
          <Music size="20" class="shrink-0" />
          {currentTitle.title}
        </p>
        <a class="font-medium text-lg max-md:hidden" href={`/user/${data.user.id}/album/${currentAlbum}`}>{currentTitle.album}</a>
      </div>

      <div class="flex gap-1 items-center lg:fixed lg:left-1/2 lg:-translate-x-1/2">
        <button class="items-center sm hidden md:flex" onclick={toggleRepeat} class:secondary={repeating === 0}>
          {#if repeating === 0}
            <ArrowRightToLine strokeWidth="1.5" />
          {:else if repeating === 1}
            <Repeat strokeWidth="1.5" />
          {:else}
            <Repeat1 strokeWidth="1.5" />
          {/if}
        </button>

        <button
          class="items-center sm hidden md:flex"
          disabled={currentIndex === 0}
          onclick={() => {
            currentIndex!--;
            playCurrentTitle();
          }}
        >
          <SkipBack strokeWidth="1.5" fill="currentColor" />
        </button>

        <button
          class="iconbtn sm"
          onclick={() => {
            player!.paused ? ((doNotPlay = false), player!.play()) : player!.pause();
          }}
          disabled={currentState === State.Buffering}
        >
          {#if currentState === State.Paused}
            <Play size="32" strokeWidth="1.75" fill="currentColor" />
          {:else if currentState === State.Playing}
            <Pause size="32" strokeWidth="1.75" fill="currentColor" />
          {:else}
            <Loader size="32" strokeWidth="1.75" class="animate-spin" />
          {/if}
        </button>

        <button
          class="items-center sm hidden md:flex"
          disabled={currentIndex + 1 === queue.length}
          onclick={() => {
            currentIndex!++;
            playCurrentTitle();
          }}
        >
          <SkipForward strokeWidth="1.5" fill="currentColor" />
        </button>

        {#if !large.current && !(isSearching && searchTerm)}
          <button
            class="items-center sm flex secondary"
            onclick={() => {
              isPoppedUp = true;
            }}
          >
            <ChevronUp strokeWidth="1.5" />
          </button>
        {/if}
      </div>

      {#if large.current}
        <div class="flex gap-2 items-center justify-end">
          <span class="text-xl">{currentTime === undefined ? "--:--" : secondStringify(currentTime)}</span>
          <input type="range" class="w-[20vw]" max={Math.round(duration ?? 0)} value={currentTime ?? 0} onchange={seek} />
          <span class="text-xl">{duration === undefined ? "--:--" : secondStringify(duration)}</span>
        </div>
      {/if}
    {:else}
      <div>
        <p class="text-xl font-semibold">Welcome to AudioShelf!</p>
        <p>Start by playing one of your Audiobook.</p>
      </div>
    {/if}
  </div>
{/if}
