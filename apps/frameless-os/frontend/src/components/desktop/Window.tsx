import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface WindowProps {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized?: boolean;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMaximize?: (id: string) => void;
  children: ReactNode;
}

export function Window({
  id, title, icon, x, y, width, height, zIndex, minimized, maximized,
  onFocus, onClose, onMinimize, onMove, onMaximize, children
}: WindowProps) {
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => { setPos({ x, y }); }, [x, y]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (maximized) return;
    e.preventDefault();
    onFocus(id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: pos.x, initY: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const newX = dragRef.current.initX + ev.clientX - dragRef.current.startX;
      const newY = Math.max(0, dragRef.current.initY + ev.clientY - dragRef.current.startY);
      setPos({ x: newX, y: newY });
    };

    const onUp = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const newX = dragRef.current.initX + ev.clientX - dragRef.current.startX;
      const newY = Math.max(0, dragRef.current.initY + ev.clientY - dragRef.current.startY);
      onMove(id, newX, newY);
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [id, pos, maximized, onFocus]);

  if (minimized) return null;

  const style = maximized
    ? { top: 0, left: 0, width: "100%", height: "calc(100% - 48px)", zIndex }
    : { top: pos.y, left: pos.x, width, height, zIndex };

  return (
    <div
      className="absolute flex flex-col rounded-sm overflow-hidden select-none"
      style={{
        ...style,
        background: "hsl(220,55%,6%)",
        border: "1px solid rgba(0,212,255,0.25)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,212,255,0.08)",
      }}
      onMouseDown={() => onFocus(id)}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing shrink-0"
        style={{
          background: "hsl(220,60%,8%)",
          borderBottom: "1px solid rgba(0,212,255,0.15)",
          userSelect: "none",
        }}
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => onMaximize?.(id)}
      >
        <span style={{ fontSize: "0.9rem" }}>{icon}</span>
        <span
          className="flex-1 text-xs font-bold tracking-widest truncate"
          style={{ color: "hsl(185,80%,65%)", fontSize: "0.65rem", letterSpacing: "0.12em" }}
        >
          {title}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onMinimize(id)}
            className="w-3 h-3 rounded-full flex items-center justify-center text-xs transition-opacity hover:opacity-80"
            style={{ background: "hsl(50,100%,50%)" }}
            title="Minimize"
          />
          <button
            onClick={() => onMaximize?.(id)}
            className="w-3 h-3 rounded-full flex items-center justify-center text-xs transition-opacity hover:opacity-80"
            style={{ background: "hsl(140,100%,40%)" }}
            title="Maximize"
          />
          <button
            onClick={() => onClose(id)}
            className="w-3 h-3 rounded-full flex items-center justify-center text-xs transition-opacity hover:opacity-80"
            style={{ background: "hsl(0,100%,50%)" }}
            title="Close"
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
