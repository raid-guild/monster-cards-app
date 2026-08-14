import Link from "next/link";
import Image from "next/image";
import { ETHERSCAN_CONTRACT_URL, RAIDGUILD_URL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>MONSTERS // CHAIN ID 1</p>
        <div className="footer-links">
          <Link href={ETHERSCAN_CONTRACT_URL} target="_blank" rel="noopener noreferrer">CONTRACT ↗</Link>
          <Link href={RAIDGUILD_URL} target="_blank" rel="noopener noreferrer" className="raid-credit">
            <Image src="/swords-logo.svg" width={23} height={23} alt="" aria-hidden="true" /> BUILT BY RAIDGUILD
          </Link>
        </div>
      </div>
    </footer>
  );
}
