// One home over expo-image-picker (features never import it directly). Library
// pick or camera capture → a small typed result, 'cancelled', or 'denied' (a
// denied camera is not an error to throw — the caller offers Open Settings).
// Pass base64:true only when the bytes are needed (vision import); the journal
// only needs the uri, so it skips the heavier payload.
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { showActionSheet } from './actionSheet';

export interface PickedImage {
  uri: string;
  base64: string | null;
  mimeType: string | null;
}

export type PickResult = PickedImage | 'cancelled' | 'denied';

function toPicked(result: ImagePicker.ImagePickerResult): PickedImage | 'cancelled' {
  if (result.canceled || !result.assets?.[0]) return 'cancelled';
  const a = result.assets[0];
  return { uri: a.uri, base64: a.base64 ?? null, mimeType: a.mimeType ?? null };
}

// No library permission: the system picker (PHPicker) runs out of process and
// hands back only what the user picks, so asking first is a needless prompt.
export async function pickFromLibrary(opts: { base64?: boolean } = {}): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: opts.base64 ?? false,
    // APP-7: iPhone library photos are HEIC, and expo-image-picker hands HEIC
    // (and TIFF/AVIF/WebP) back as the untouched original — GPS tags included
    // (ImageUtils.swift readDataAndFileExtension). "Compatible" makes iOS
    // transcode to JPEG first, which then takes the re-encode path through
    // UIImage.jpegData — and that drops EXIF. Camera captures already do.
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  return toPicked(result);
}

export async function takePhoto(opts: { base64?: boolean } = {}): Promise<PickResult> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return 'denied';
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    base64: opts.base64 ?? false,
  });
  return toPicked(result);
}

// Camera or library is the person's call, asked up front — cancelling the
// camera must not open the library behind their back. Web skips the sheet: a
// browser's file input already offers the camera on phones.
export async function choosePhoto(opts: { base64?: boolean } = {}): Promise<PickResult> {
  if (Platform.OS === 'web') return pickFromLibrary(opts);
  const choice = await showActionSheet({
    title: 'Add a photo',
    options: ['Take photo', 'Choose from library'],
  });
  if (choice === 0) return takePhoto(opts);
  if (choice === 1) return pickFromLibrary(opts);
  return 'cancelled';
}
