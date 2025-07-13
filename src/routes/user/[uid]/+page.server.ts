import type { PageServerLoad } from "../../../../.svelte-kit/types/src/routes/user/[uid]/$types.d.ts";
import { db } from "../../../lib/prisma.ts";

export const load = (async () => {
    return { allAlbums: await db.album.findMany({ include: { titles: true } }) };
}) satisfies PageServerLoad;
