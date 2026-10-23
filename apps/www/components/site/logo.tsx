/** The Aedis keystone (public/logo.svg). Its edge follows the theme's foreground, so it holds on light and dark. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <polygon points="8,8 56,8 47,58 17,58" fill="#c8a24c" stroke="var(--foreground)" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="56,8 47,58 40,8" fill="#9c7c2c" />
      <circle cx="32" cy="27" r="6.5" fill="#0e1626" />
      <rect x="29.5" y="29" width="5" height="15" rx="1.5" fill="#0e1626" />
    </svg>
  );
}
