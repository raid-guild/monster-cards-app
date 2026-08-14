import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "./globals.css";
import { Providers } from "@/app/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "Monsters — The Ember Archive", template: "%s // Monsters" },
  description: "Reveal the creature hidden inside your on-chain Monsters traits.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><Providers><div className="noise" aria-hidden="true"/><SiteHeader/><main>{children}</main><SiteFooter/></Providers></body></html>;
}
