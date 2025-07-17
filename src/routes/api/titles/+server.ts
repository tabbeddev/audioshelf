import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const GET: RequestHandler = async () => {
  return json(await db.titles.findMany());
};
