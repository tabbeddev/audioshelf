/// <reference lib="webworker" />

import { build, files, version, prerendered } from "$service-worker";

const APP_SHELL_CACHE = "app-shell-" + version;
const DATA_CACHE = "audiobook-data-v1";

function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
}

// [Cache] all static files
// @ts-ignore it is an event
self.addEventListener("install", (event: InstallEvent) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      cache.addAll([...build, ...files, ...prerendered]).catch((err) => console.error("Failed to pre-cache app shell", err));
    })
  );
});

// [Clean up] old Cache data
// @ts-ignore it is an event
self.addEventListener("activate", (event: ActivateEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![APP_SHELL_CACHE, DATA_CACHE].includes(key)) return caches.delete(key);
        })
      )
    )
  );
});

// [Cache and Load from Cache]
// @ts-ignore it is an event
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle when same origin
  if (
    url.origin !== self.location.origin ||
    request.method !== "GET" ||
    url.pathname.startsWith("/health") ||
    url.pathname.startsWith("/setup")
  )
    return;

  function respondWithCacheFirst(cacheName: string, timeout: number) {
    return caches.open(cacheName).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetchWithTimeout(request, {}, timeout);
        if (response.status === 200) cache.put(request, response.clone());
        return response;
      } catch {
        return new Response(JSON.stringify({ message: "Connect to your server and try again" }), {
          status: 503,
          statusText: "Offline or not cached",
        });
      }
    });
  }

  // Static Data
  const isStatic = /\.(js|css|png)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(respondWithCacheFirst(APP_SHELL_CACHE, 500));
    return;
  }

  // Handle Media Data
  const isMedia = /^\/api\/(?:albums|titles)\/\d+\/?$/m.test(url.pathname);
  if (isMedia) {
    event.respondWith(respondWithCacheFirst(DATA_CACHE, 2000));
    return;
  }

  // [Cache and Load from Cache]
  event.respondWith(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      try {
        const response = await fetchWithTimeout(request);
        if (!response.ok && response.status !== 404) throw new Error();
        if (response.status === 200) cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        return (
          cached ||
          new Response(JSON.stringify({ message: "Connect to your server and try again" }), {
            status: 503,
            statusText: "Offline or not cached",
          })
        );
      }
    })
  );
});
