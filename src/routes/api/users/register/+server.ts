import type { RequestHandler } from "../../../../../.svelte-kit/types/src/routes/api/users/register/$types.d.ts";
import { db, Prisma } from "../../../../lib/prisma.ts";
import { error } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  const { username, isadmin = false } = await request.json();

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
