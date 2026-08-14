"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WalletControl } from "@/components/wallet-control";

const links = [["/explore", "Explore"], ["/collection", "My Monsters"], ["/about", "About"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="wordmark" aria-label="Monsters home"><span aria-hidden="true">M</span> MONSTERS</Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
          <WalletControl />
        </nav>
        <button className="menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <WalletControl />
      </nav>}
    </header>
  );
}
