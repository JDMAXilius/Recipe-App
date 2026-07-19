import { supabase } from "./supabase";

// Where recipe photos live. This bucket must exist and be PUBLIC, with an
// INSERT policy that lets an authenticated user write under their own
// `${auth.uid()}/…` folder. See docs/TERMINAL_TICKET_FUNCTIONAL_FIXES.md.
const BUCKET = "recipe-photos";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Decode base64 → bytes ourselves. supabase-js on React Native silently
// uploads a 0-byte file when handed a Blob from fetch(uri) (a long-standing
// RN quirk), and atob isn't guaranteed on every engine — so we go straight
// from the base64 expo-image-picker already hands us to a Uint8Array.
function base64ToBytes(base64) {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor((len * 3) / 4));
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = B64.indexOf(clean[i]);
    const b = B64.indexOf(clean[i + 1]);
    const c = B64.indexOf(clean[i + 2]);
    const d = B64.indexOf(clean[i + 3]);
    bytes[p++] = (a << 2) | (b >> 4);
    if (c !== -1) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (d !== -1) bytes[p++] = ((c & 3) << 6) | d;
  }
  return p === bytes.length ? bytes : bytes.subarray(0, p);
}

// Upload a picked photo (base64 from ImagePicker) to Storage and return its
// public URL — the string that goes into recipe.image, which the whole app
// already renders. Throws on failure so the caller can show an honest message.
export async function uploadRecipePhoto(base64, ext = "jpg") {
  const bytes = base64ToBytes(base64);
  if (!bytes.length) throw new Error("That photo came through empty — try another.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const owner = user?.id || "anon";
  const safeExt = /^(jpe?g|png|webp|heic)$/i.test(ext) ? ext.toLowerCase() : "jpg";
  const path = `${owner}/${Date.now()}.${safeExt}`;
  const contentType =
    safeExt === "png"
      ? "image/png"
      : safeExt === "webp"
        ? "image/webp"
        : safeExt === "heic"
          ? "image/heic"
          : "image/jpeg";

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Uploaded, but couldn't get a link back.");
  return data.publicUrl;
}
