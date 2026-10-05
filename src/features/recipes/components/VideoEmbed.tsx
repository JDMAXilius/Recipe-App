import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text as RNText, View } from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';
import { haptics } from '@/shared/haptics';
import { Text } from '@/shared/ui';

// Inline recipe video — the tap swaps the thumbnail for an in-card player and
// never leaves the app (no browser hand-off, Juan 2026-10-05). Web plays via a native <iframe>; native plays via an
// in-app <WebView> (react-native-webview). The webview module is required lazily
// inside NativeVideo, which is only rendered on native, so the web bundle never
// pulls in the native-only module.
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

// Native-only in-app player. The require is inside this component (never
// rendered on web) so Metro's web bundle never evaluates react-native-webview,
// which has no web support.
//
// The player page lives on ottosapp.com (Otto_Website public/embed/youtube.html).
// YouTube refuses embeds that lack a real https origin + Referer (errors
// 150/152/153); an inline HTML string can't give it either, which is why the
// first play used to fail and a second one worked. The page posts "ready" or
// "error:<code>"; the first error gets one silent retry, the second shows the
// honest fallback.
const PLAYER_URL = 'https://ottosapp.com/embed/youtube.html';

function NativeVideo({ videoId, onFail }: { videoId: string; onFail: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const uri = `${PLAYER_URL}?v=${videoId}`;
  const retryOrFail = () => (attempt === 0 ? setAttempt(1) : onFail());
  // A webview that stalls silently never posts "ready": treat 12 s of nothing as a failure.
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(retryOrFail, 12000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ready]);
  return (
    <WebView
      key={attempt}
      source={{ uri }}
      style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radii.card }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      onMessage={(e) => {
        const msg = e.nativeEvent.data;
        if (msg === 'ready') setReady(true);
        else if (msg.startsWith('error')) retryOrFail();
      }}
      // Taps on the YouTube logo / title navigate the top frame to youtube.com,
      // which turned the card into the YouTube mobile site. Video stays in Otto
      // (Juan, 2026-10-05): keep the player page and its iframes, ignore the rest.
      onShouldStartLoadWithRequest={(req) => req.url.startsWith(PLAYER_URL) || req.isTopFrame === false}
      onError={retryOrFail}
      onHttpError={retryOrFail}
      onRenderProcessGone={onFail}
    />
  );
}

export function VideoEmbed({ youtubeUrl }: { youtubeUrl: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tries, setTries] = useState(0);
  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) return null;

  const onPlay = () => setPlaying(true);

  return (
    <View style={{ gap: space[2] }}>
      <Text role="title">See it made</Text>
      {playing && !failed ? (
        Platform.OS === 'web' ? (
          React.createElement('iframe', {
            title: 'Recipe video',
            src: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
            style: { width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: radii.card },
            allow: 'autoplay; encrypted-media',
            allowFullScreen: true,
          })
        ) : (
          <NativeVideo key={tries} videoId={videoId} onFail={() => setFailed(true)} />
        )
      ) : failed ? (
        // Two in-app attempts already failed (or the uploader blocks embedding).
        // Video stays in Otto (Juan, 2026-10-05): offer another in-app try, no browser.
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try the recipe video again"
          onPress={() => {
            haptics.select();
            setTries((n) => n + 1);
            setFailed(false);
          }}
          style={{
            backgroundColor: colors.creamDeep,
            borderRadius: radii.card,
            padding: space[5],
            alignItems: 'center',
            gap: space[2],
          }}
        >
          <Text role="body">The video didn’t load.</Text>
          <Text role="computed">Tap to try again</Text>
        </Pressable>
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
    </View>
  );
}
