import YoutubePlayer from "react-native-youtube-iframe";

// Native inline YouTube (iOS/Android). react-native-youtube-iframe manages the
// embed origin/handshake internally, so no "Error 153", and it plays inside the
// card instead of leaving the app. Metro serves this file on native; the .web
// sibling (a plain <iframe>) serves on web, so youtube-iframe never enters the
// web bundle (it doesn't build there).
export default function VideoEmbed({ videoId, width, height }) {
  return (
    <YoutubePlayer
      height={height}
      width={width}
      play
      videoId={videoId}
      initialPlayerParams={{ modestbranding: true, rel: false, controls: true }}
      webViewProps={{
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
      }}
    />
  );
}
