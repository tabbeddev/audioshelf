import { error } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../../.svelte-kit/types/src/routes/api/titles/[titleid]/$types.d.ts";
import { db } from "../../../../lib/prisma.ts";
import { extname } from "jsr:@std/path";
import { contentType } from "@std/media-types";
import { openSync, statSync, readSync, close, existsSync } from "node:fs";

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    Number(params.titleid);
  } catch {
    return error(400, { message: "Invalid titleid" });
  }

  const titleid = Number(params.titleid);
  const result = await db.titles.findUnique({ where: { id: titleid } });

  if (!result) return error(404, { message: `Title ${titleid} not found` });
  if (!existsSync(result.path)) return error(404, { message: "Title found, but not file" });

  try {
    const fileStat = statSync(result.path);
    const fileSize = fileStat.size;

    // check for range requests
    const range = request.headers.get("range");
    let start = 0;
    let end = fileSize - 1;

    if (range) {
      const matches = range.match(/bytes=(\d+)-(\d+)?/);
      if (matches) {
        start = parseInt(matches[1], 10);
        if (matches[2]) {
          end = parseInt(matches[2], 10);
        }
      } else {
        console.error("Invalid range format");
        return error(416, { message: "Invalid range format" });
      }
    }

    start = Math.max(0, start);
    end = Math.min(end, fileSize - 1);

    const file = openSync(result.path, "r");

    const stream = new ReadableStream({
      pull(controller) {
        const buffer = new Uint8Array(51920);
        const bytesRead = readSync(file, buffer, { position: start });

        if (bytesRead === null || start > end) {
          controller.close();
          close(file);
          return;
        }

        const chunk = buffer.subarray(0, Math.min(bytesRead, end - start + 1));
        controller.enqueue(chunk);
        start += chunk.length;

        if (start > end) {
          controller.close();
          close(file);
        }
      },
      cancel() {
        close(file);
      },
    });

    return new Response(stream, {
      status: range ? 206 : 200,
      headers: {
        "Content-Type": contentType(extname(result.path))!,
        "Content-Length": (end - start + 1).toString(),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error(err);
    return error(500, { message: "Error reading file" });
  }
};
