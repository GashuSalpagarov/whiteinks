import type { Metadata, Viewport } from "next";
import { Cursor } from "@/components/ui/Cursor";
import { GlobalCanvas } from "@/r3f/GlobalCanvas";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "White Inks",
  description: "Развитие на стыке инженерии и продукта",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <GlobalCanvas />
          {children}
        </Providers>
        <Cursor />
      </body>
    </html>
  );
}
