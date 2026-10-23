import { ShareCard } from "@/registry/aedis/ui/share-card";

const logo = (
  <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true">
    <polygon points="8,8 56,8 47,58 17,58" fill="#c8a24c" stroke="#0e1626" strokeWidth="3" strokeLinejoin="round" />
    <polygon points="56,8 47,58 40,8" fill="#9c7c2c" />
    <circle cx="32" cy="27" r="6.5" fill="#0e1626" />
    <rect x="29.5" y="29" width="5" height="15" rx="1.5" fill="#0e1626" />
  </svg>
);

const art = (
  <svg width="430" height="300" viewBox="0 0 430 300" aria-hidden="true">
    <rect x="1" y="1" width="428" height="298" rx="22" fill="#ffffff" stroke="rgba(22,27,38,.10)" />
    <rect x="110" y="40" width="130" height="40" rx="11" fill="#ffffff" stroke="rgba(22,27,38,.14)" />
    <rect x="110" y="92" width="220" height="150" rx="16" fill="#ffffff" stroke="rgba(22,27,38,.10)" />
    <rect x="122" y="144" width="196" height="34" rx="9" fill="#e8eefc" />
  </svg>
);

// The card is 1200×630; an SVG viewBox scales it to the column. In the browser it draws with the page's font,
// in next/og with the bundled Geist.
export default function ShareCardDemo() {
  return (
    <div className="grid w-full gap-4">
      {(["light", "dark", "brand"] as const).map((theme) => (
        <svg key={theme} viewBox="0 0 1200 630" role="img" aria-label={`Share card for Dropdown Menu, ${theme} theme`} className="w-full rounded-lg border border-hairline">
          <foreignObject width="1200" height="630">
            <ShareCard
              theme={theme}
              brand={{ name: "Aedis UI", logo }}
              eyebrow="Overlays · Component"
              title="Dropdown Menu"
              description="A menu of actions: account menu, row actions, a more button."
              chips={["Base UI", "Keyboard", "DOM sink"]}
              domain="ui.aedis.build"
              art={art}
            />
          </foreignObject>
        </svg>
      ))}
    </div>
  );
}
