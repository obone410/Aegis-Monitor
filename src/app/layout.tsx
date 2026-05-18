import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis-Monitor",
  description:
    "A production-minded cloud operations and deployment observability console.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
