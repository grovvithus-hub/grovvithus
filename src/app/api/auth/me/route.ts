import { ok, route } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export const GET = route({}, async () => ok(await requireUser()));
