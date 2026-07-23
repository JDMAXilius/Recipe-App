// delete-account — App Store 5.1.1(v). The user id comes ONLY from the
// verified access token, never from the body. Order matters and is kept from
// v1: rows first (one transaction via admin_delete_user_data — the v1
// half-deleted-account incident is why it's a single DB function), then
// storage photos, then the auth user — the reverse order would strand data no
// one can sign in to reach. Service-role key only via Deno.env; never logged.
import { getUserId, json, preflight, rateLimited, serviceClient } from "../_shared/http.ts";

const PHOTO_BUCKET = "recipe-photos";

// Storage's list() pages at 100 — page until the folder is empty rather than
// deleting the first page and calling it done.
// ponytail: hard page cap as a runaway guard — 5k photos would be a different
// problem anyway.
const MAX_PHOTO_PAGES = 50;
// deno-lint-ignore no-explicit-any
async function deleteUserPhotos(admin: any, userId: string): Promise<number> {
  let removed = 0;
  for (let page = 0; page < MAX_PHOTO_PAGES; page++) {
    const { data, error } = await admin.storage.from(PHOTO_BUCKET).list(userId, { limit: 100 });
    // A storage failure must NOT fail the request: the rows are already gone
    // and the deletion genuinely succeeded. An honest short count beats a 500.
    if (error) {
      console.error("photo cleanup: list failed", error.message);
      break;
    }
    if (!data?.length) break;
    const { error: removeError } = await admin.storage
      .from(PHOTO_BUCKET)
      // deno-lint-ignore no-explicit-any
      .remove(data.map((object: any) => `${userId}/${object.name}`));
    if (removeError) {
      console.error("photo cleanup: remove failed", removeError.message);
      break;
    }
    removed += data.length;
    if (data.length < 100) break;
  }
  return removed;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST" && req.method !== "DELETE") {
    return json(405, { error: "POST or DELETE only" });
  }

  const userId = await getUserId(req);
  if (!userId) return json(401, { error: "Missing or invalid access token" });
  // Irreversible and never done twice in a row — v1 destructiveLimiter tier.
  if (rateLimited(`del:${userId}`, 5, 15 * 60 * 1000)) {
    return json(429, { error: "Too many requests — give it a few minutes and try again" });
  }

  const admin = serviceClient();
  try {
    // ONE transaction for every owned row (see 20260721090009).
    const { error } = await admin.rpc("admin_delete_user_data", { p_user_id: userId });
    if (error) throw new Error(error.message);

    // Photos live in Storage, not Postgres — and the bucket is public, so
    // anything left behind stays fetchable by direct URL. Same 5.1.1(v)
    // reason the auth user goes.
    const photosDeleted = await deleteUserPhotos(admin, userId);

    // Only once the data is safely gone do we drop the login.
    const { error: authError } = await admin.auth.admin.deleteUser(userId);

    return json(200, { dataDeleted: true, authUserDeleted: !authError, photosDeleted });
  } catch (error) {
    console.error("delete account failed", (error as Error).message);
    return json(500, { error: "Something went wrong" });
  }
});
