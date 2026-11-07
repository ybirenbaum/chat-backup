import type { NextConfig } from "next";

// Static export for GitHub Pages: the whole app is client-rendered (Firebase
// Auth + Cloudinary), so there's nothing that needs a Node server.
const repoName = "chat-backup";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",
  env: {
    // Lets client code build absolute share links that include the base
    // path, since basePath itself isn't readable at runtime.
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? `/${repoName}` : "",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
