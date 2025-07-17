import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { scrapeLibraries } from "$lib/manageData.ts";

export const POST: RequestHandler = async ({ request }) => {
	console.log("Reading... args")
  const { rebuild = false }: { rebuild: boolean } = (await request.json()) ?? {};
	console.log("Read args")

  try {
    await scrapeLibraries(rebuild);
    return new Response("Scraped");
  } catch (e) {
    console.error(e);

    return error(500, "Failed to scrape libraries.");
  }
};
