import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import ShaderBackground from "@/components/ShaderBackground";import { TooltipProvider } from "@/components/ui/tooltip";import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "MemoryForge AI",
  description: "Memoria evolutiva y verificable para agentes de IA sobre Arkiv.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${headingFont.variable} ${monoFont.variable}`}>
        <ShaderBackground />
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
