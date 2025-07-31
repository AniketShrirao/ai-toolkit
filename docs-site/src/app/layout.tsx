import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { DocumentationLayout } from "@/components/layout/DocumentationLayout";
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
        <NavigationProvider>
          <DocumentationLayout>
            {children}
          </DocumentationLayout>
        </NavigationProvider>
      </body>
    </html>
  );
}
