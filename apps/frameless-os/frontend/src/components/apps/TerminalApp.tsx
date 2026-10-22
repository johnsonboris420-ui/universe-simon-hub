import { KeyboardEvent, useEffect, useRef, useState } from "react";

interface Line {
  type: "command" | "output" | "error" | "success";
  text: string;
}

const BOOT_LINES: Line[] = [
  { type: "success", text: "FRAMELESS OS v2.4.1 — Quantum Terminal" },
  { type: "output", text: "Session authenticated via CRYSTALS-Kyber-1024" },
  { type: "output", text: "Connected to API server — live system data available." },
  { type: "output", text: 'Type "help" to see available commands.' },
  { type: "output", text: "" },
];

export function TerminalApp() {
  const [lines, setLines] = useState<Line[]>(BOOT_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const run = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed || busy) return;
    const newHistory = [trimmed, ...history].slice(0, 100);
    setHistory(newHistory);
    setHistIdx(-1);

    const cmdLine: Line = { type: "command", text: `root@frameless:~$ ${trimmed}` };

    if (trimmed === "clear") {
      setLines([...BOOT_LINES]);
      return;
    }

    setBusy(true);
    setLines(prev => [...prev, cmdLine, { type: "output", text: "..." }]);

    try {
      const resp = await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed }),
      });
      const data = await resp.json();

      if (data.clear) {
        setLines([...BOOT_LINES]);
        return;
      }

      const newLines: Line[] = data.output ?? [{ type: "error", text: "No response from server" }];
      setLines(prev => [...prev.slice(0, -1), ...newLines]);
    } catch (err: any) {
      setLines(prev => [
        ...prev.slice(0, -1),
        { type: "error", text: `Connection error: ${err?.message}` },
        { type: "output", text: "" },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(newIdx);
      setInput(history[newIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(histIdx - 1, -1);
      setHistIdx(newIdx);
      setInput(newIdx === -1 ? "" : history[newIdx]);
    }
  };

  const lineColor = (type: Line["type"]) => {
    if (type === "command") return "hsl(185,100%,60%)";
    if (type === "success") return "hsl(140,100%,55%)";
    if (type === "error") return "hsl(0,90%,60%)";
    return "hsl(185,30%,55%)";
  };

  return (
    <div
      className="flex flex-col h-full cursor-text"
      style={{ background: "hsl(220,65%,4%)", fontFamily: "'JetBrains Mono', monospace" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: lineColor(line.type),
              fontSize: "0.7rem",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              minHeight: line.text === "" ? "0.5rem" : undefined,
            }}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{ borderTop: "1px solid rgba(0,212,255,0.1)", background: "hsl(220,65%,5%)" }}
      >
        <span style={{ color: "hsl(185,100%,50%)", fontSize: "0.7rem" }}>root@frameless:~$</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none"
          style={{ color: "hsl(185,80%,70%)", fontSize: "0.7rem", caretColor: "hsl(185,100%,50%)" }}
          spellCheck={false}
          disabled={busy}
          placeholder={busy ? "processing..." : ""}
        />
        {busy
          ? <span className="w-2 h-4 animate-pulse" style={{ background: "hsl(185,100%,50%)", opacity: 0.4 }} />
          : <span className="w-2 h-4 animate-pulse" style={{ background: "hsl(185,100%,50%)" }} />
        }
      </div>
    </div>
  );
}
