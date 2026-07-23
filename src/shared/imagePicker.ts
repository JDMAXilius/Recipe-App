// One home over expo-image-picker (features never import it directly). Library
// pick or camera capture → a small typed result, or null on cancel / denied
// permission (a denied permission is not an error to throw — the caller shows a
// friendly nudge). Pass base64:true only when the bytes are needed (vision
// import); the journal only needs the uri, so it skips the heavier payload.
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  base64: string | null;
  mimeType: string | null;
}

function toPicked(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, base64: a.base64 ?? null, mimeType: a.mimeType ?? null };
}

export async function pickFromLibrary(opts: { base64?: boolean } = {}): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: opts.base64 ?? false,
  });
  return toPicked(result);
}

export async function takePhoto(opts: { base64?: boolean } = {}): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    base64: opts.base64 ?? false,
  });
  return toPicked(result);
}
