import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { dev, version } from "$app/environment";

export const GET: RequestHandler = () => {
  return json({
    message: "Hey! I'm AudioShelf",
    version,
    dev,
  });
};
