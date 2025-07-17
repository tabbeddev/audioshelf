import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/prisma.ts";

export const load = (async () => {
    return { allAlbums: await db.album.findMany({ include: { titles: true } }) };
}) satisfies PageServerLoad;
