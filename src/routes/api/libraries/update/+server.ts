import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { scrapeLibraries } from "$lib/server/manageData";

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
