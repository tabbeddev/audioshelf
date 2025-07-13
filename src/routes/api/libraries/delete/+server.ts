import { error } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../../.svelte-kit/types/src/routes/api/libraries/create/$types.d.ts";
import { db, Prisma } from "../../../../lib/prisma.ts";

export const POST: RequestHandler = async ({ request }) => {
  const { name }: { name: string } = await request.json();

  try {
    const entry = await db.libraries.delete({ where: { name } });

    await db.titles.deleteMany({ where: { path: { startsWith: entry.path } } });

    return new Response("Deleted");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code == "P2025") {
        return error(404, {
          message: "No library found.",
        });
      }
    }

    return error(500, { message: "An internal server error occured." });
  }
};
