import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DocumentationLayout } from "@/components/layout/DocumentationLayout";
import { getThemeInitScript } from "@/lib/theme-init";
import "./globals.css";
import "../styles/globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Toolkit Documentation",
  description: "Comprehensive documentation for the AI Toolkit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: getThemeInitScript(),
          }}
        />
        <ThemeProvider>
          <NavigationProvider>
            <DocumentationLayout>
              {children}
            </DocumentationLayout>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
