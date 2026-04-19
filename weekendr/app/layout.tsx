import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weekendr — Friday plans. Weekend memories.",
  description: "Stop spending Saturday morning deciding what to do. Get three curated Melbourne weekend plans every Friday evening.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Weekendr",
    description: "Friday plans. Weekend memories.",
    siteName: "Weekendr",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1C1814",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
