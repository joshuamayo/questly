import type { Metadata, Viewport } from "next";
import "@fontsource/alegreya-sans/400.css";
import "@fontsource/alegreya-sans/500.css";
import "@fontsource/alegreya-sans/700.css";
import "@fontsource/alegreya-sans/400-italic.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Questly", template: "%s · Questly" },
  description: "One quest at a time. Real progress. Real rewards.",
};

export const viewport: Viewport = {
  themeColor: "#13110e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
