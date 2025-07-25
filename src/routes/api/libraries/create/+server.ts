import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";
import { Prisma } from "$lib/server/prismaFix";
import { existsSync } from "node:fs";

export const POST: RequestHandler = async ({ request }) => {
  const { name, path }: { name: string; path: string } = await request.json();

  if (!existsSync(path)) return error(404, { message: "The path does not exist" });

  try {
    await db.libraries.create({ data: { name, path } });
    return new Response("Created");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code == "P2002") {
        const conflict = String(err.meta?.target).replaceAll("_", " ").split(" key")[0];

        return error(409, {
          message: `The ${conflict} already exists!`,
        });
      }
    }

    console.error(err);

    return error(500, { message: "An internal server error occured." });
  }
};
