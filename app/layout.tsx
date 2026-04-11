import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "K-career",
  description: "interview-pod / es-trainer 統合入口",
  applicationName: "K-career",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "K-career",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}