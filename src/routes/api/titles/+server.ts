import { json } from "@sveltejs/kit";
import type { RequestHandler } from "../../../../.svelte-kit/types/src/routes/api/titles/$types.d.ts";
import { db } from "../../../lib/prisma.ts";

export const GET: RequestHandler = async () => {
  return json(await db.titles.findMany());
};
