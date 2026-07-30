import { Link } from "react-router-dom";

/**
 * Company/OS wordmark + monogram logo. Pure SVG so it scales cleanly.
 * Variants: 'wordmark' (default, mark + text) | 'mark' (just the icon)
 */
export default function Logo({ variant = "wordmark", size = 20, className = "", testid = "logo" }) {
  const px = size;
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 font-display font-bold ${className}`} data-testid={testid}>
      <svg width={px} height={px} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Company/OS logo">
        {/* Outer bracket-ish square */}
        <rect x="1.5" y="1.5" width="29" height="29" stroke="hsl(15 100% 50%)" strokeWidth="2" />
        {/* Inner block */}
        <rect x="7" y="7" width="18" height="18" fill="hsl(15 100% 50%)" />
        {/* Slash cut */}
        <path d="M22 5 L10 27" stroke="hsl(0 0% 4%)" strokeWidth="3" strokeLinecap="square" />
        {/* Corner pixel */}
        <rect x="25" y="25" width="3" height="3" fill="hsl(0 0% 98%)" />
      </svg>
      {variant === "wordmark" && (
        <span className="tracking-tight text-[15px]">
          COMPANY<span className="text-primary">/</span>OS
        </span>
      )}
    </Link>
  );
}
