"use client";

import { useRef, useState } from "react";
import { getFileIcon } from "./FileIcons";

export interface Tab {
  id: string;
  label: string;
  filePath: string;
  sourceSessionId?: string | null;
}

interface Props {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const TAB_MAX_WIDTH = 220;

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab }: Props) {
  const [hoveredClose, setHoveredClose] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  // Edge-style: while the mouse hovers the tab strip, freeze each tab's
  // pixel width so closing a tab doesn't shift the remaining tabs (allows
  // repeated close clicks). Widths are re-distributed on mouse leave.
  const [frozenWidths, setFrozenWidths] = useState<number[] | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const freezeWidths = () => {
    if (frozenWidths) return;
    const el = barRef.current;
    if (!el) return;
    const widths = Array.from(el.children).map(
      (child) => (child as HTMLElement).offsetWidth,
    );
    setFrozenWidths(widths);
  };

  return (
    <div
      ref={barRef}
      onMouseEnter={freezeWidths}
      onMouseLeave={() => setFrozenWidths(null)}
      style={{
        display: "flex",
        alignItems: "flex-end",
        background: "var(--bg-panel)",
        overflow: "hidden",
        flexShrink: 0,
        height: 36,
      }}
    >
      {tabs.map((tab, i) => {
        const isActive = tab.id === activeTabId;
        const isHovered = hoveredTab === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            onMouseDown={(e) => {
              if (e.button === 1) e.preventDefault();
            }}
            onAuxClick={(e) => {
              if (e.button !== 1) return;
              e.preventDefault();
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              paddingLeft: 12,
              paddingRight: 6,
              borderRight:
                i === tabs.length - 1 ? "none" : "1px solid var(--border)",
              background: isActive
                ? "var(--bg)"
                : isHovered
                  ? "var(--bg-hover)"
                  : "var(--bg-panel)",
              borderTopLeftRadius: isActive ? 6 : 0,
              borderTopRightRadius: isActive ? 6 : 0,
              cursor: "pointer",
              fontSize: 12,
              color: isActive ? "var(--text)" : "var(--text-muted)",
              whiteSpace: "nowrap",
              userSelect: "none",
              ...(frozenWidths
                ? { width: frozenWidths[i] ?? 0, flex: "0 0 auto" }
                : { flex: "1 1 0", minWidth: 76, maxWidth: TAB_MAX_WIDTH }),
            }}
          >
            <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7, display: "flex", alignItems: "center" }}>
              {getFileIcon(tab.label, 13)}
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
                minWidth: 0,
                fontWeight: isActive ? 500 : 400,
              }}
              title={tab.filePath}
            >
              {tab.label}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id); }}
              onMouseEnter={() => setHoveredClose(tab.id)}
              onMouseLeave={() => setHoveredClose(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24,
                background: hoveredClose === tab.id ? "var(--bg-hover)" : "transparent",
                border: "none",
                borderRadius: 4,
                color: hoveredClose === tab.id ? "var(--text)" : "var(--text-dim)",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
                transition: "background 0.1s, color 0.1s",
              }}
              title="Close"
              aria-label={`Close ${tab.label}`}
            >
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <line x1="2" y1="2" x2="8" y2="8" />
                <line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
