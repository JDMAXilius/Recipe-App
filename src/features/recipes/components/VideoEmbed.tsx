import React, { useState } from 'react';
import { Image, Platform, Pressable, Text as RNText, View } from 'react-native';
import { colors, radii, space } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui';

// Inline recipe video — the tap swaps the thumbnail for an in-card player and
// never leaves the app. Web plays via a native <iframe>; native plays via an
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
function NativeVideo({ videoId }: { videoId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WebView } = require('react-native-webview') as typeof import('react-native-webview');
  // A bare iframe to youtube.com/embed fails in WKWebView (error 153/152 — the
  // player's referrer/origin check rejects loadHTMLString's null origin). The
  // YouTube IFrame Player API builds the player itself and handles the origin,
  // which is the reliable in-app path. baseUrl=youtube.com sets the document
  // origin the API expects.
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;background:#000;overflow:hidden}#player{width:100%;height:100%}</style></head><body><div id="player"></div><script>var t=document.createElement('script');t.src="https://www.youtube.com/iframe_api";document.body.appendChild(t);function onYouTubeIframeAPIReady(){new YT.Player('player',{videoId:'${videoId}',width:'100%',height:'100%',playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:'https://www.youtube.com'}});}</script></body></html>`;
  return (
    <WebView
      source={{ html, baseUrl: 'https://www.youtube.com' }}
      style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: radii.card }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={['*']}
    />
  );
}

export function VideoEmbed({ youtubeUrl }: { youtubeUrl: string | null }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) return null;

  const onPlay = () => setPlaying(true);

  return (
    <View style={{ gap: space[2] }}>
      <Text role="title">See it made</Text>
      {playing ? (
        Platform.OS === 'web' ? (
          React.createElement('iframe', {
            title: 'Recipe video',
            src: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
            style: { width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: radii.card },
            allow: 'autoplay; encrypted-media',
            allowFullScreen: true,
          })
        ) : (
          <NativeVideo videoId={videoId} />
        )
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
