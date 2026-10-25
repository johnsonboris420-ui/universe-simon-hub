export const NO_VALUE = "Sepolia test tokens, no cash value";
export const card = "rounded-xl border border-border/60 bg-card/50 p-5 space-y-3";
export const btn = "inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 disabled:opacity-50";
export const input = "w-full rounded-lg bg-background border border-border px-3 py-2 text-sm font-mono";
export function Badge({ text = NO_VALUE }: { text?: string }) {
  return <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">{text}</span>;
}
export async function api(path: string, body?: unknown) {
  const r = await fetch(`/api${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ error: "Bad response" }));
  return { status: r.status, ...j };
}
