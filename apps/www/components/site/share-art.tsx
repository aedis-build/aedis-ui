import type { CSSProperties, ReactNode } from "react";

import { colors } from "@/registry/aedis/lib/tokens";

/**
 * The illustrations on the right of the site's share cards (430×300), one per section, after the canvas board.
 * Flex boxes and Satori text, not SVG <text>: next/og rasterizes SVG without fonts. Text uses only characters the
 * card's Geist covers (symbols are drawn as SVG paths), so nothing is fetched. Always the light colors: on the dark
 * card they read as screens.
 */
const c = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, v.light])) as Record<keyof typeof colors, string>;

const panel: CSSProperties = { display: "flex", flexDirection: "column", backgroundColor: c.surface, border: `1px solid ${c.border}`, borderRadius: 18, padding: 16, gap: 10 };
const label: CSSProperties = { fontSize: 14, fontWeight: 600, color: c.foreground };
const small: CSSProperties = { fontSize: 12, color: c["muted-foreground"] };
const row: CSSProperties = { display: "flex", alignItems: "center" };
const Bar = ({ width, color = c.muted, height = 10 }: { width: number | string; color?: string; height?: number }) => (
  <div style={{ display: "flex", width, height, borderRadius: height / 2, backgroundColor: color }} />
);

function HomeArt() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: 430, height: 300, gap: 14 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ ...panel, width: 200, height: 136 }}>
          <span style={label}>Approval pending</span>
          <span style={small}>Send the Q3 report</span>
          <div style={{ ...row, gap: 8, marginTop: "auto" }}>
            <span style={{ display: "flex", padding: "5px 12px", borderRadius: 8, border: `1px solid ${c.border}`, fontSize: 12, color: c.destructive }}>Decline</span>
            <span style={{ display: "flex", padding: "5px 12px", borderRadius: 8, backgroundColor: c.primary, fontSize: 12, color: c["primary-foreground"] }}>Approve</span>
          </div>
        </div>
        <div style={{ ...panel, flex: 1, height: 136 }}>
          <span style={label}>Tokens this week</span>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: "auto", height: 64 }}>
            {[34, 54, 44, 64, 52, 24].map((h, i) => (
              <div key={i} style={{ display: "flex", width: 20, height: h, borderRadius: 5, backgroundColor: i === 5 ? c["accent-soft"] : c.primary }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...panel, height: 150 }}>
        <span style={label}>Support agent</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span style={{ display: "flex", padding: "7px 14px", borderRadius: 14, backgroundColor: c.primary, fontSize: 12, color: c["primary-foreground"] }}>Why was invoice 4821 charged twice?</span>
        </div>
        <div style={{ display: "flex" }}>
          <span style={{ display: "flex", padding: "9px 14px", borderRadius: 14, backgroundColor: c.background, fontSize: 12, color: c.foreground }}>The retry job ran twice. I can refund it.</span>
        </div>
      </div>
    </div>
  );
}

function ComponentArt() {
  const item: CSSProperties = { ...row, padding: "8px 12px", borderRadius: 9, fontSize: 14 };
  return (
    <div style={{ ...panel, width: 430, height: 300, backgroundColor: c.background, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ ...row, width: 230, justifyContent: "space-between", padding: "10px 16px", borderRadius: 11, backgroundColor: c.surface, border: `1px solid ${c.border}` }}>
        <span style={label}>Session</span>
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 4l4 4 4-4" fill="none" stroke={c.foreground} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ ...panel, width: 230, padding: 8, gap: 4 }}>
        <span style={{ ...item, color: c.foreground }}>Renew token</span>
        <span style={{ ...item, color: c.link, backgroundColor: c["accent-soft"] }}>See devices</span>
        <span style={{ ...item, color: c.destructive }}>Revoke all sessions</span>
      </div>
    </div>
  );
}

function BlocksArt() {
  return (
    <div style={{ display: "flex", width: 430, height: 300, borderRadius: 22, border: `1px solid ${c.border}`, backgroundColor: c.surface, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 110, gap: 12, padding: 16, backgroundColor: c.background }}>
        <span style={label}>Console</span>
        <Bar width={70} color={c.primary} />
        <Bar width={60} />
        <Bar width={76} />
        <Bar width={50} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12, padding: 16 }}>
        <span style={label}>Agents</span>
        {["Support agent", "Billing agent", "Research agent"].map((name, i) => (
          <div key={name} style={{ ...row, gap: 10, padding: "8px 10px", borderRadius: 10, border: `1px solid ${c.border}` }}>
            <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, backgroundColor: i === 2 ? c.warning : c.success }} />
            <span style={{ fontSize: 13, color: c.foreground }}>{name}</span>
            <div style={{ display: "flex", marginLeft: "auto" }}>
              <Bar width={48} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartsArt() {
  const days = [58, 46, 52, 30, 36, 18, 24];
  const legend = (color: string, text: string) => (
    <div style={{ ...row, gap: 6 }}>
      <div style={{ display: "flex", width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <span style={small}>{text}</span>
    </div>
  );
  return (
    <div style={{ ...panel, width: 430, height: 300, padding: 20, gap: 14 }}>
      <span style={label}>Spend per day</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 170, borderBottom: `1px solid ${c.border}` }}>
        {days.map((d, i) => (
          <div key={i} style={{ display: "flex", flex: 1, height: 170 - d * 2, borderRadius: 6, backgroundColor: i % 2 ? c["chart-2"] : c["chart-1"] }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {legend(c["chart-1"], "Tokens")}
        {legend(c["chart-2"], "Tool calls")}
      </div>
    </div>
  );
}

function MicroFrontendsArt() {
  return (
    <div style={{ ...panel, width: 430, height: 300, padding: 0, gap: 0, overflow: "hidden" }}>
      <div style={{ ...row, gap: 10, height: 48, padding: "0 20px", backgroundColor: c.background }}>
        <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, backgroundColor: c.accent }} />
        <span style={label}>Shell</span>
      </div>
      <div style={{ display: "flex", flex: 1, gap: 16, padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 230, gap: 10, padding: 16, borderRadius: 16, border: `2px dashed ${c.primary}`, backgroundColor: c["accent-soft"] }}>
          <span style={label}>Billing · MfFrame</span>
          <div style={{ display: "flex", height: 30, borderRadius: 9, backgroundColor: c.surface }} />
          <div style={{ display: "flex", height: 30, borderRadius: 9, backgroundColor: c.surface }} />
          <span style={{ ...small, color: c.link }}>mf-bridge, origin checked</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
          <div style={{ ...panel, padding: 14 }}>
            <span style={{ ...label, fontSize: 13 }}>mf-element</span>
            <Bar width="100%" color={c.primary} height={8} />
          </div>
          <div style={{ ...panel, padding: 14 }}>
            <span style={{ ...label, fontSize: 13 }}>/docs zone</span>
            <Bar width="70%" height={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityArt() {
  const sinks: [string, string][] = [["DOM", "Markup never runs"], ["Input", "Validated where it lands"], ["Transport", "Origin-checked"], ["Session", "Tokens stay on the server"]];
  return (
    <div style={{ ...panel, width: 430, height: 300, padding: 20, gap: 12 }}>
      <span style={label}>Sinks defended</span>
      {sinks.map(([sink, text]) => (
        <div key={sink} style={{ ...row, gap: 12, padding: "9px 12px", borderRadius: 12, backgroundColor: c.background }}>
          <svg width="22" height="22" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="11" fill={c.success} />
            <path d="M6.5 11.5l3 3 6-6.5" fill="none" stroke={c.surface} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ ...label, width: 80 }}>{sink}</span>
          <span style={small}>{text}</span>
        </div>
      ))}
    </div>
  );
}

export type ShareSection = "home" | "component" | "blocks" | "charts" | "micro-frontends" | "security";

export const shareArt: Record<ShareSection, () => ReactNode> = {
  home: HomeArt,
  component: ComponentArt,
  blocks: BlocksArt,
  charts: ChartsArt,
  "micro-frontends": MicroFrontendsArt,
  security: SecurityArt,
};
