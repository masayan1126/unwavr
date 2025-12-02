import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "unwavr",
    short_name: "unwavr",
    description: "毎日・特定曜日・積み上げ候補をまとめて管理",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#3b82f6",
    icons: [
      { src: "/unwavr-logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}


