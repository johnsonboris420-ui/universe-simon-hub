import { useState } from "react";

// Plain share links only: no tracking SDKs, no third-party scripts.
export function ShareBar({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url), t = encodeURIComponent(text);
  const links = [
    ["X", `https://x.com/intent/post?text=${t}&url=${u}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["WhatsApp", `https://wa.me/?text=${t}%20${u}`],
    ["Telegram", `https://t.me/share/url?url=${u}&text=${t}`],
    ["Reddit", `https://www.reddit.com/submit?url=${u}&title=${t}`],
  ];
  const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
  const b = "px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25";
  return (
    <div className="flex flex-wrap gap-2" data-testid="share-bar">
      {nav?.share && <button className={b} onClick={() => nav.share({ title: text, url }).catch(() => {})}>Share…</button>}
      {links.map(([n, h]) => <a key={n} className={b} href={h} target="_blank" rel="noopener noreferrer">{n}</a>)}
      <button className={b} onClick={() => navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>{copied ? "Copied!" : "Copy link"}</button>
    </div>
  );
}
