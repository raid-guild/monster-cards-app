"use client";

import { useState, type ReactNode } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ethereumMainnet } from "@/lib/constants";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "Monsters",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "monster-archive-local-review",
  chains: [ethereumMainnet],
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({ accentColor: "#b83a25", accentColorForeground: "#080807", borderRadius: "small", fontStack: "system" })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
