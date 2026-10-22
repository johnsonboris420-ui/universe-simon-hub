import { FormEvent, useEffect, useRef, useState } from "react";

interface Msg { role: "user" | "assistant"; content: string; streaming?: boolean; }

const SUGGESTIONS = [
  "What threats were blocked today?",
  "Show AI agent ethics scores",
  "Explain the Guardian Protocol",
  "What is the mesh network status?",
  "Run a self-heal cycle report",
  "Investor metrics summary",
];

export function AiAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "ARIA online — AI Runtime Intelligence Agent active at kernel level.\n\nI have real-time access to all system subsystems: threat feed, AI agent ethics scores, child protection guardian, global mesh network, and self-healing logs.\n\nHow can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setBusy(true);

    const ariaMsg: Msg = { role: "assistant", content: "", streaming: true };
    setMessages([...history, ariaMsg]);

    try {
      const resp = await fetch("/api/aria/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok || !resp.body) throw new Error("Network error");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6));
            if (json.done) break;
            if (json.error) throw new Error(json.error);
            if (json.content) {
              full += json.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: full, streaming: true };
                return updated;
              });
            }
          } catch {}
        }
      }
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: full };
        return updated;
      });
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `⚠ ARIA error: ${err?.message ?? "connection failed"}` };
        return updated;
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,65%,4%)", fontFamily: "'JetBrains Mono', monospace" }}>
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ background: "hsl(220,60%,6%)", borderBottom: "1px solid rgba(0,212,255,0.12)" }}
      >
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "hsl(185,100%,50%)" }} />
        <span style={{ color: "hsl(185,100%,60%)", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
          ARIA — AI Runtime Intelligence Agent
        </span>
        <div className="ml-auto px-1.5 py-0.5 rounded" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "hsl(140,80%,55%)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>
          GPT-5 LIVE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs"
              style={{
                background: m.role === "assistant" ? "rgba(0,212,255,0.15)" : "rgba(100,200,100,0.15)",
                border: `1px solid ${m.role === "assistant" ? "rgba(0,212,255,0.3)" : "rgba(100,200,100,0.3)"}`,
                color: m.role === "assistant" ? "hsl(185,100%,60%)" : "hsl(140,80%,60%)",
                fontSize: "0.65rem",
              }}
            >
              {m.role === "assistant" ? "◈" : "U"}
            </div>
            <div
              className="rounded px-3 py-2"
              style={{
                maxWidth: "75%",
                background: m.role === "assistant" ? "rgba(0,212,255,0.05)" : "rgba(100,200,100,0.08)",
                border: `1px solid ${m.role === "assistant" ? "rgba(0,212,255,0.1)" : "rgba(100,200,100,0.15)"}`,
                color: m.role === "assistant" ? "hsl(185,50%,70%)" : "hsl(140,60%,70%)",
                fontSize: "0.63rem",
                lineHeight: "1.65",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
              {m.streaming && <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ background: "hsl(185,100%,50%)" }} />}
            </div>
          </div>
        ))}

        {!busy && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-2 py-1 rounded text-xs transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "rgba(0,212,255,0.06)",
                  border: "1px solid rgba(0,212,255,0.15)",
                  color: "hsl(185,70%,55%)",
                  fontSize: "0.6rem",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {busy && (
          <div className="flex gap-2 items-center" style={{ color: "hsl(185,40%,50%)", fontSize: "0.6rem" }}>
            <span className="animate-spin inline-block">◈</span>
            <span>ARIA processing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderTop: "1px solid rgba(0,212,255,0.1)", background: "hsl(220,65%,5%)" }}
      >
        <span style={{ color: "hsl(185,100%,50%)", fontSize: "0.65rem" }}>aria&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ARIA anything about the system..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: "hsl(185,80%,70%)", fontSize: "0.65rem", caretColor: "hsl(185,100%,50%)" }}
          disabled={busy}
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-2 py-1 rounded transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
          style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "hsl(185,100%,55%)", fontSize: "0.65rem" }}
        >
          ↵
        </button>
      </form>
    </div>
  );
}
