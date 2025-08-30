import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "unwavr",
    short_name: "unwavr",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    icons: [
      { src: "/unwavr-logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}


