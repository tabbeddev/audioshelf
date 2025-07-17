import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";
import { Prisma } from "$lib/prisma.ts";
import { error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  const { username, isadmin = false }: { username: string; isadmin: boolean } = await request.json();

  try {
    await db.user.create({ data: { username, isadmin } });

    console.log("Created " + username);

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

    return error(500, { message: "An internal server error occured." });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  const { username, isadmin }: { username: string; isadmin: boolean } = await request.json();

  try {
    await db.user.update({ where: { username }, data: { isadmin } });

    return new Response("Updated");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code == "P2025") {
        return error(404, { message: "No user found" });
      }
    }

    return error(500, { message: "An internal server error occured." });
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  const { username }: { username: string } = await request.json();

  try {
    await db.user.delete({ where: { username } });

    return new Response("Deleted");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code == "P2025") {
        return error(404, { message: "No user found" });
      }
    }

    return error(500, { message: "An internal server error occured." });
  }
};
