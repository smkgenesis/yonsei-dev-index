import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yonsei Dev Index",
  description: "A low-friction directory of Yonsei-affiliated developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
