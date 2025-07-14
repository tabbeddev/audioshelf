import { error } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../../.svelte-kit/types/src/routes/api/libraries/update/$types.d.ts";
import { scrapeLibraries } from "../../../../lib/manageData.ts";

export const POST: RequestHandler = async ({ request }) => {
  const { rebuild = false }: { rebuild: boolean } = (await request.json()) ?? {};

  try {
    await scrapeLibraries(rebuild);
    return new Response("Scraped");
  } catch (e) {
    console.error(e);

    return error(500, "Failed to scrape libraries.");
  }
};
