import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";
import { Prisma } from "$lib/server/prismaFix";

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
