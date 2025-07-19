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
    WifiOff,
  } from "@lucide/svelte";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import { createAvatar } from "@dicebear/core";
  import { shapes } from "@dicebear/collection";
  import { goto } from "$app/navigation";
  import { secondStringify } from "$lib/util";
  import Cover from "$lib/components/covers/cover.svelte";
  import { calcElapsedTime, convertMetadataToAlbum, getAlbumLength, getArtistsOfAlbum, getGenresOfAlbum } from "$lib/albumUtil";
  import { MediaQuery } from "svelte/reactivity";
  import { startedDB } from "$lib/stores/startedDB";
  import { get } from "svelte/store";
  import { albumDB } from "$lib/stores/albumDB";

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
    console.log("Triggered CurrentTitle");

    player.src = "/api/titles/" + currentTitle!.id;
    if (position) player.currentTime = position;
    player.load();

    if (mediaSessionAvailable && currentTitle) {
      console.log("Updated Metadata");

      navigator.mediaSession.metadata!.album = currentTitle.album;
      navigator.mediaSession.metadata!.artist = currentTitle.artist;
      navigator.mediaSession.metadata!.title = currentTitle.title;
      navigator.mediaSession.metadata!.artwork = [
        { src: "/512x512.png", sizes: "512x512" },
        { src: "/favicon.png", sizes: "256x256" },
        { src: "/96x96.png", sizes: "96x96" },
      ];
    }
  }

  async function playAlbum({ albumid, titleid, position }: { albumid: number; titleid?: number; position?: number }) {
    if (!player) return console.warn("Player not ready");
    currentAlbum = albumid;

    if (data.serverAvailable) {
      const response = await fetch("/api/albums/" + albumid);
      if (!response.ok)
        return postMessage({
          type: "error",
          title: "Can't play this album",
          subtitle: response.status === 503 ? "Album not found" : (await response.json()).message,
        } as App.Notification);

      albumMetadata = await response.json();
    } else if ("caches" in window) {
      const metadata = get(albumDB)[currentAlbum];
      if (!metadata)
        return postMessage({
          type: "error",
          title: "Can't play this album",
          subtitle: "You're offline and this album isn't downloaded",
        } as App.Notification);

      albumMetadata = metadata;
    } else {
      return postMessage({
        title: "Can't play this album",
        subtitle: "You're offline and downloads are not available",
      } as App.Notification);
    }

    if (!titleid) titleid = queue[0];

    currentIndex = queue.indexOf(titleid);
    playCurrentTitle(position);
  }

  async function saveCurrentState() {
    if (!(player && currentIndex !== undefined && queue.length !== 0 && currentAlbum !== undefined && album))
      return console.warn("Player not ready");

    if (data.serverAvailable) {
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
          subtitle: "You won't be able to resume your audiobook: " + (await response.json()).message,
        } as App.Notification);
        console.warn({
          albumid: currentAlbum,
          titleid: queue[currentIndex!],
          position: Math.round(player!.currentTime),
        });
      }
    }

    startedDB.update((value) => {
      if (!(data.user.id in value)) value[data.user.id] = {};

      for (const album of Object.keys(value[data.user.id])) {
        value[data.user.id][Number(album)].lastplayed = false;
      }

      value[data.user.id][currentAlbum!] = {
        lastplayed: true,
        position: Math.round(player!.currentTime),
        titleid: queue[currentIndex!],
        artist: getArtistsOfAlbum(album.titles),
        length: getAlbumLength(album),
        name: album.name,
        totalProgress: calcElapsedTime(queue[currentIndex!], album) + Math.round(player!.currentTime),
      };
      return value;
    });
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

  let player = $state<HTMLAudioElement>();

  // List of title ids;
  let albumMetadata = $state<Data.Metadata>();
  let queue: number[] = $derived(
    Object.values(albumMetadata?.discs ?? {})
      .flat()
      .map((v) => v.id),
  );
  let currentIndex = $state<number>();
  let currentTitle = $derived(
    Object.values(albumMetadata?.discs ?? {})
      .flat()
      .find((v) => v.id === queue[currentIndex ?? 0]),
  );

  // Album id
  let currentAlbum = $state<number>();

  let album = $derived(albumMetadata && currentAlbum !== undefined ? convertMetadataToAlbum(albumMetadata, currentAlbum) : undefined);

  // UI stuff
  let duration = $state<number>();
  let currentTime = $state<number>();

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

  let mediaSessionAvailable = false;

  const large = new MediaQuery("width >= 64rem");

  onMount(async () => {
    player = new Audio();
    player.addEventListener("durationchange", () => {
      duration = player!.duration;
    });

    player.addEventListener("timeupdate", () => {
      currentTime = player!.currentTime;

      if (mediaSessionAvailable && duration)
        navigator.mediaSession.setPositionState({
          duration: duration,
          position: currentTime,
        });
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

    // Media Session API

    mediaSessionAvailable = "mediaSession" in navigator;

    if (mediaSessionAvailable) {
      navigator.mediaSession.metadata = new MediaMetadata();
      console.log("MediaMetadata initialized");

      navigator.mediaSession.setActionHandler("play", () => {
        if (!player) return;
        player.play();
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        if (!player) return;
        player.pause();
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (!player || !currentIndex || currentIndex + 1 === queue.length) return;
        currentIndex++;

        playCurrentTitle();
      });

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (!player || !currentIndex || currentIndex === 0) return;
        currentIndex--;

        playCurrentTitle();
      });

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!player || !details.seekTime) return;

        player.currentTime = details.seekTime;
      });

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        if (!player || !details.seekTime) return;
        const skipTime = details.seekOffset || 10;

        player.currentTime = Math.max(player.currentTime - skipTime, 0);
      });

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        if (!player || !details.seekTime) return;
        const skipTime = details.seekOffset || 10;

        player.currentTime = Math.min(player.currentTime + skipTime, player.duration);
      });
    }

    // Resume last audiobook

    const hasLocalData = Object.entries(get(startedDB)).filter((v) => Object.keys(v[1]).length > 0).length > 0;

    if (!hasLocalData && data.serverAvailable) {
      console.log("Only server has a state");

      const lastState = data.states.find((v) => v.lastplayed);
      doNotPlay = true;
      if (lastState) playAlbum(lastState);
    } else if (hasLocalData) {
      console.log("At least client has a state");

      const db = get(startedDB)[data.user.id];
      const states = Object.entries(db);
      const lastState = states.find((v) => v[1].lastplayed);
      doNotPlay = true;
      if (lastState) {
        playAlbum({ albumid: Number(lastState[0]), position: lastState[1].position, titleid: lastState[1].titleid });

        // Sync to server if available
        if (data.serverAvailable) {
          console.log("Syncing...");
          const response = await fetch(`/api/users/${data.user.id}/playstate`, {
            method: "POST",
            body: JSON.stringify({
              albumid: Number(lastState[0]),
              titleid: lastState[1].titleid,
              position: lastState[1].position,
            }),
          });

          if (!response.ok) {
            postMessage({
              type: "warning",
              title: "Failed to sync play state",
              subtitle: "You won't be able to resume your audiobook on other devices: " + (await response.json()).message,
            } as App.Notification);
            console.warn({
              albumid: currentAlbum,
              titleid: queue[currentIndex!],
              position: Math.round(player!.currentTime),
            });
          }
        }
      }
    }
  });

  onMount(() => onDestroy(saveCurrentState));

  $effect(() => {
    if (!navigator.mediaSession.metadata) return;

    switch (currentState) {
      case State.Playing:
        navigator.mediaSession.playbackState = "playing";

      case State.Paused:
        navigator.mediaSession.playbackState = "paused";

      case State.Buffering:
        navigator.mediaSession.playbackState = "none";
    }
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
    {#if data.serverAvailable}
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
                    <span>({getGenresOfAlbum(album)}) by {getArtistsOfAlbum(album.titles)} ({album._count.titles} titles)</span>
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
    {:else}
      <div class="secondbg">
        <h1 class="text-2xl iconbtn">
          <WifiOff />
          Oops. You're ofline!
        </h1>
        <p class="text-lg">Connect to the server to search.</p>
      </div>
    {/if}
  </div>
{/if}

<main class="mt-16 mb-18 mx-2">
  {@render children()}
</main>

<!-- Navbar -->
<div class="scnbg h-14 w-full fixed left-0 top-0 flex justify-between gap-2 items-center">
  <p class="hidden items-center gap-1 text-2xl ml-4 lg:flex">
    {#if data.serverAvailable}
      <BookAudio size="36" strokeWidth="1.25" />
    {:else}
      <WifiOff size="36" strokeWidth="1.25" />
    {/if}
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
        disabled={!data.serverAvailable}
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

        {#if !(isSearching && searchTerm)}
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
