import { useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "threat";
  ts: number;
}

const COLORS = {
  info:    { bg: "rgba(0,140,255,0.12)",   border: "rgba(0,140,255,0.3)",   text: "hsl(210,100%,65%)", icon: "ℹ" },
  success: { bg: "rgba(0,200,100,0.12)",   border: "rgba(0,200,100,0.3)",   text: "hsl(140,100%,60%)", icon: "✓" },
  warning: { bg: "rgba(255,180,0,0.12)",   border: "rgba(255,180,0,0.3)",   text: "hsl(40,100%,60%)",  icon: "⚠" },
  threat:  { bg: "rgba(255,40,60,0.12)",   border: "rgba(255,40,60,0.3)",   text: "hsl(0,90%,60%)",    icon: "⛨" },
};

export function useNotificationEmitter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const add = (n: Omit<Notification, "id" | "ts">) => {
    const full: Notification = { ...n, id: crypto.randomUUID(), ts: Date.now() };
    setNotifications(prev => [full, ...prev].slice(0, 8));
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== full.id)), 9000);
    return full;
  };

  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const count = notifications.length;

  useEffect(() => {
    const t1 = setTimeout(() => {
      add({ type: "success", title: "Boot complete", body: "FRAMELESS OS v2.4.1 — all subsystems operational" });
    }, 3200);
    const t2 = setTimeout(() => {
      add({ type: "info", title: "Mesh network", body: "84,291 nodes connected — sync complete" });
    }, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    let es: EventSource;
    const connect = () => {
      es = new EventSource("/api/system/events/stream");
      esRef.current = es;
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.title && data.body && data.type) {
            add({ type: data.type as Notification["type"], title: data.title, body: data.body });
          }
        } catch {}
      };
      es.onerror = () => {
        es.close();
        setTimeout(connect, 20000);
      };
    };
    const t = setTimeout(connect, 4500);
    return () => { clearTimeout(t); esRef.current?.close(); };
  }, []);

  return { notifications, dismiss, count };
}

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationSystem({ notifications, onDismiss }: Props) {
  return (
    <div className="fixed top-10 right-3 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: "280px" }}>
      {notifications.map((n) => {
        const c = COLORS[n.type];
        return (
          <div
            key={n.id}
            className="rounded-lg px-3 py-2.5 pointer-events-auto"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              backdropFilter: "blur(12px)",
              animation: "notifSlide 0.25s ease-out",
            }}
          >
            <div className="flex items-start gap-2">
              <span style={{ color: c.text, fontSize: "0.75rem", lineHeight: 1, marginTop: "1px" }}>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div style={{ color: c.text, fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.05em" }}>{n.title}</div>
                <div style={{ color: "hsl(185,30%,60%)", fontSize: "0.58rem", lineHeight: 1.4, marginTop: "2px" }}>{n.body}</div>
              </div>
              <button
                onClick={() => onDismiss(n.id)}
                style={{ color: "hsl(185,20%,40%)", fontSize: "0.65rem", lineHeight: 1, padding: "1px 3px", flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes notifSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
