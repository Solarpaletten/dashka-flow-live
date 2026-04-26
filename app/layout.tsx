import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Flow Live",
  description: "Personal real-time translation in your ear",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
