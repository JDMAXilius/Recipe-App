import React from "react";

// Web inline YouTube — a real <iframe> (react-dom renders it), so the video
// plays inside the page instead of opening youtube.com in a new tab. Matches
// the native player's inline behaviour so the app flow is the same everywhere.
export default function VideoEmbed({ videoId, width, height }) {
  return React.createElement("iframe", {
    src: `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
    width,
    height,
    frameBorder: 0,
    allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
    allowFullScreen: true,
    style: { border: 0, display: "block" },
  });
}
