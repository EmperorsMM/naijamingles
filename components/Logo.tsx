export default function Logo({
  className = "",
  text = "Naijamingles",
  showText = true,
}: {
  className?: string;
  text?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label={text}>
      {/* Logomark */}
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="nmGradCmp" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E11D48" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#nmGradCmp)" />
        <path
          d="M32 46c-4.8-2.3-14-9.1-14-18 0-5.5 4.5-10 10-10 2.9 0 5.6 1.3 7.5 3.4C37.4 19.3 40.1 18 43 18c5.5 0 10 4.5 10 10 0 8.9-9.2 15.7-14 18-2 1-4 1-7 0z"
          fill="white"
        />
      </svg>

      {/* Wordmark */}
      {showText && <span className="text-sm font-semibold tracking-tight">{text}</span>}
    </div>
  );
}
