"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { abbreviateAddress } from "@/lib/utils";

export function WalletControl({ compact = false }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        if (!connected) return <button className="button button-primary wallet-button" onClick={openConnectModal}>CONNECT {compact ? "" : "WALLET"}</button>;
        if (chain.unsupported) return <button className="button button-danger wallet-button" onClick={openChainModal}>WRONG NETWORK</button>;
        return <button className="button button-secondary wallet-button" onClick={openAccountModal}>{abbreviateAddress(account.address)}</button>;
      }}
    </ConnectButton.Custom>
  );
}
