import type { LayoutLoad } from "./$types";

export const load = (async ({ data, fetch }) => {
  let serverAvailable = true;

  try {
    const res = await fetch("/health");
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }

  return { ...data, serverAvailable };
}) satisfies LayoutLoad;