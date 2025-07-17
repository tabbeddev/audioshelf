import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
  const { origin } = url;

  const manifest = {
    name: `AudioShelf (${url.hostname})`,
    short_name: "AudioShelf",
    start_url: origin + "/",
    scope: origin + "/",
    display: "standalone",
    theme_color: "#4A6EA0",
    background_color: "#333A44",
    icons: [
      { src: "/512x512.png", sizes: "512x512" },
      { src: "/favicon.png", sizes: "256x256" },
      { src: "/96x96.png", sizes: "96x96" },
    ],
    id: "/",
    screenshots: [
      { src: "/screenshot_desktop.png", form_factor: "wide", sizes: "3840x2160" },
      { src: "/screenshot_mobile.png", form_factor: "narrow", sizes: "1082x2402" },
    ],
    description: "Listen to all your favorite audiobooks, for free on your own server.",
  };

  return json(manifest);
};
