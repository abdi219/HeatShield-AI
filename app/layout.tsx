import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#080B10",
};

export const metadata: Metadata = {
  title: "HeatShield AI — Street-Level Urban Microclimate Intelligence",
  description: "Detect, understand, avoid, and reduce urban heat using street-level temperature spatial data, heat-aware routing, and simulation.",
  keywords: ["urban heat island", "FortyGuard", "microclimate", "cool routing", "heat mitigation", "urban resilience"],
  authors: [{ name: "HeatShield AI Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas-base text-ink-primary min-h-screen antialiased selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
