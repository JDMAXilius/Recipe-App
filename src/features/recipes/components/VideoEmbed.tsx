import React, { useState } from 'react';
import { Image, Linking, Platform, Pressable, Text as RNText, View } from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui';

// Inline recipe video — dep-free (no youtube-player library in v2). On web the
// tap swaps the thumbnail for a native <iframe>; on native it opens YouTube via
// Linking (a WebView isn't an installed dependency). The tap therefore never
// leaves the app on web, and stays honest on native.
// ponytail: native plays out-of-app; add an in-card player when a WebView /
// youtube-iframe dep is approved.
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export function VideoEmbed({ youtubeUrl }: { youtubeUrl: string | null }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) return null;

  const onPlay = () => {
    if (Platform.OS === 'web') setPlaying(true);
    else Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`).catch(() => {});
  };

  return (
    <View style={{ gap: space[2] }}>
      <Text role="title">See it made</Text>
      {playing && Platform.OS === 'web' ? (
        React.createElement('iframe', {
          title: 'Recipe video',
          src: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
          style: { width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: radii.card },
          allow: 'autoplay; encrypted-media',
          allowFullScreen: true,
        })
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Play recipe video"
          onPress={onPlay}
          style={{ borderRadius: radii.card, overflow: 'hidden', backgroundColor: colors.creamDeep }}
        >
          <Image
            source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
            style={{ width: '100%', aspectRatio: 16 / 9 }}
            resizeMode="cover"
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.cream,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RNText style={{ fontSize: 22, color: colors.terracotta }}>▶</RNText>
            </View>
          </View>
        </Pressable>
      )}
      <Text role="caption">Watch this one being made before you start.</Text>
    </View>
  );
}
