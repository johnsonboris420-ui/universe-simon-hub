import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Badge, card } from "./s67m-shared";

export default function AboutS67M() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">About S67M</h1><Badge text="Sepolia test token, no cash value, not an investment" /></div>
        <div className={card}>
          <h2 className="font-semibold">What it is</h2>
          <p className="text-sm">S67M (Simon67 Mineable) is a learning token on <b>Sepolia</b>, Ethereum's public test network. Test networks exist for experiments: their tokens have <b>no cash value</b>, can't be bought or sold here, and S67M is <b>not an investment</b>. There is no price and none is promised. Contract: <a className="underline break-all" href="https://sepolia.etherscan.io/address/0x01F818701E6C202Ad900a7E63a300662bF17068f" target="_blank" rel="noreferrer">0x01F818701E6C202Ad900a7E63a300662bF17068f</a>.</p>
        </div>
        <div className={card}>
          <h2 className="font-semibold">How to earn it</h2>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li><Link href="/earn" className="underline">Learn to earn</Link>: finish a short blockchain lesson and quiz, paste a public address, get 10 S67M per lesson.</li>
            <li><b>Mining</b>: S67M is proof-of-work. Anyone can search for a nonce that makes the hash fall below the target and call <code>mint(nonce)</code> to receive 50 S67M (you need a little free Sepolia ETH for gas). Live stats are on the <Link href="/mining" className="underline">mining page</Link>.</li>
          </ul>
        </div>
        <div className={card}>
          <h2 className="font-semibold">What it unlocks</h2>
          <ul className="text-sm list-disc ml-5 space-y-1">
            <li>100 S67M: an exclusive fractal phone wallpaper</li>
            <li>500 S67M: early access to the newest evolved Mandelbulb</li>
            <li>1,000 S67M: a vote on the next print</li>
          </ul>
          <p className="text-sm"><Link href="/perks" className="underline">Check your perks</Link>. We only read your public balance and, for downloads, ask you to sign a free message. We never ask for keys or seed phrases.</p>
        </div>
        <div className={card}>
          <h2 className="font-semibold">Stay safe</h2>
          <p className="text-sm">Never send real ETH to get S67M, and never share a private key or seed phrase. Anyone offering to sell you S67M is not us. The art itself is sold only through the <a className="underline" href="/fractal-house/">Fractal House</a>.</p>
        </div>
      </div>
    </Layout>
  );
}
