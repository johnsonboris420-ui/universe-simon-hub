import { useEffect, useState } from "react";

interface FsItem {
  id: number;
  path: string;
  name: string;
  type: "folder" | "file";
  size?: number;
  icon?: string;
  parent_path?: string;
  updated_at?: string;
  content?: string;
}

function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  if (bytes > 1e3) return (bytes / 1e3).toFixed(0) + " KB";
  return bytes + " B";
}

function fmtDate(s?: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FileExplorerApp() {
  const [path, setPath] = useState("/");
  const [items, setItems] = useState<FsItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<FsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [creating, setCreating] = useState(false);

  const pathParts = path === "/" ? [] : path.split("/").filter(Boolean);

  const fetchItems = async (p: string) => {
    setLoading(true);
    setSelected(null);
    try {
      const r = await fetch(`/api/fs/list?parent=${encodeURIComponent(p)}`);
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(path); }, [path]);

  const open = async (item: FsItem) => {
    if (item.type === "folder") {
      setPath(item.path);
    } else {
      const r = await fetch(`/api/fs/read?path=${encodeURIComponent(item.path)}`);
      const data = await r.json();
      setPreview(data);
    }
  };

  const goBack = () => {
    if (path === "/") return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    setPath(parts.length === 0 ? "/" : "/" + parts.join("/"));
  };

  const createFile = async () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const filePath = path === "/" ? `/${name}` : `${path}/${name}`;
    await fetch("/api/fs/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filePath, name, content: "", parentPath: path }),
    });
    setNewFileName("");
    setCreating(false);
    fetchItems(path);
  };

  const deleteItem = async (item: FsItem) => {
    await fetch(`/api/fs/delete?path=${encodeURIComponent(item.path)}`, { method: "DELETE" });
    setSelected(null);
    fetchItems(path);
  };

  const fullPath = ["Home", ...pathParts].join(" › ");

  if (preview) {
    return (
      <div className="flex flex-col h-full" style={{ background: "hsl(220,55%,5%)" }}>
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(0,212,255,0.12)", background: "hsl(220,60%,7%)" }}>
          <button onClick={() => setPreview(null)} className="px-2 py-1 rounded text-xs" style={{ background: "rgba(0,212,255,0.08)", color: "hsl(185,80%,60%)", border: "1px solid rgba(0,212,255,0.15)" }}>
            ← Back
          </button>
          <span style={{ color: "hsl(185,80%,65%)", fontSize: "0.65rem", fontFamily: "JetBrains Mono" }}>{preview.name}</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre style={{ color: "hsl(185,50%,65%)", fontSize: "0.65rem", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "JetBrains Mono, monospace" }}>
            {preview.content || "(empty file)"}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "hsl(220,55%,6%)" }}>
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: "hsl(220,60%,7%)", borderBottom: "1px solid rgba(0,212,255,0.12)" }}>
        <button onClick={goBack} disabled={path === "/"} className="w-6 h-6 rounded flex items-center justify-center text-xs transition-colors hover:bg-cyan-500/10 disabled:opacity-30" style={{ color: "hsl(185,60%,50%)", border: "1px solid rgba(0,212,255,0.12)" }}>
          ←
        </button>
        <div className="flex-1 px-2.5 py-1 rounded text-xs" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)", color: "hsl(185,80%,65%)", fontFamily: "JetBrains Mono", fontSize: "0.65rem" }}>
          {fullPath}
        </div>
        <button onClick={() => setCreating(!creating)} className="w-6 h-6 rounded text-xs" style={{ background: "rgba(0,212,255,0.08)", color: "hsl(185,80%,60%)", border: "1px solid rgba(0,212,255,0.15)" }}>
          +
        </button>
        {(["grid", "list"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className="w-6 h-6 rounded text-xs transition-colors" style={{ background: view === v ? "rgba(0,212,255,0.15)" : "transparent", color: view === v ? "hsl(185,100%,55%)" : "hsl(185,40%,45%)", border: "1px solid rgba(0,212,255,0.12)" }}>
            {v === "grid" ? "⊞" : "≡"}
          </button>
        ))}
      </div>

      {creating && (
        <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(0,212,255,0.1)", background: "rgba(0,212,255,0.04)" }}>
          <input
            autoFocus
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createFile(); if (e.key === "Escape") setCreating(false); }}
            placeholder="new-file.txt"
            className="flex-1 bg-transparent outline-none"
            style={{ color: "hsl(185,80%,65%)", fontSize: "0.65rem", border: "1px solid rgba(0,212,255,0.2)", padding: "2px 6px", borderRadius: "4px", fontFamily: "JetBrains Mono" }}
          />
          <button onClick={createFile} className="px-2 py-1 rounded text-xs" style={{ background: "rgba(0,212,255,0.12)", color: "hsl(185,100%,60%)", border: "1px solid rgba(0,212,255,0.25)" }}>Create</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-12" style={{ color: "hsl(185,40%,40%)", fontSize: "0.65rem" }}>Loading...</div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.path}
                onDoubleClick={() => open(item)}
                onClick={() => setSelected(item.path)}
                onContextMenu={e => { e.preventDefault(); deleteItem(item); }}
                className="flex flex-col items-center gap-1.5 p-2 rounded text-center transition-all group"
                style={{ background: selected === item.path ? "rgba(0,212,255,0.12)" : "transparent", border: selected === item.path ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent" }}
              >
                <span style={{ fontSize: "2rem" }}>{item.icon || (item.type === "folder" ? "📁" : "📄")}</span>
                <span className="text-xs text-center break-all leading-tight" style={{ color: "hsl(185,70%,65%)", fontSize: "0.6rem", maxWidth: "70px" }}>
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
                {["Name", "Size", "Modified"].map(h => (
                  <th key={h} className="text-left pb-2 px-2" style={{ color: "hsl(185,40%,45%)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.path}
                  onDoubleClick={() => open(item)}
                  onClick={() => setSelected(item.path)}
                  style={{ background: selected === item.path ? "rgba(0,212,255,0.08)" : "transparent", cursor: "pointer" }}
                >
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-2">
                      <span>{item.icon || (item.type === "folder" ? "📁" : "📄")}</span>
                      <span style={{ color: "hsl(185,70%,65%)", fontSize: "0.7rem" }}>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2" style={{ color: "hsl(185,40%,45%)", fontSize: "0.65rem", fontFamily: "JetBrains Mono" }}>{fmtSize(item.size)}</td>
                  <td className="py-1.5 px-2" style={{ color: "hsl(185,40%,45%)", fontSize: "0.65rem" }}>{fmtDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && items.length === 0 && (
          <div className="text-center py-12" style={{ color: "hsl(185,40%,40%)" }}>
            <div className="text-3xl mb-2">📭</div>
            <div className="text-xs">Empty folder</div>
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 flex justify-between shrink-0" style={{ borderTop: "1px solid rgba(0,212,255,0.1)" }}>
        <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem" }}>{items.length} items{selected ? " · 1 selected" : ""}</span>
        <span style={{ color: "hsl(185,40%,40%)", fontSize: "0.6rem" }}>QUANTUM FS — ENCRYPTED</span>
      </div>
    </div>
  );
}
