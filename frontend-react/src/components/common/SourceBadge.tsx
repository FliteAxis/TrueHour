// Source Badge Component
// Display colorful badges showing aircraft data source (FAA, ForeFlight, Manual)

interface SourceBadgeProps {
  source?: "faa" | "foreflight" | "manual" | null;
  faaLastChecked?: string | null;
  size?: "sm" | "md";
}

export function SourceBadge({ source, faaLastChecked, size = "sm" }: SourceBadgeProps) {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  // Manual source - gray badge
  if (!source || source === "manual") {
    return (
      <span
        className={`${padding} ${textSize} rounded text-slate-400 bg-slate-700/50 border border-slate-600 inline-flex items-center gap-1`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        Manual
      </span>
    );
  }

  // Check if FAA data is stale (> 30 days)
  const isStale =
    source === "faa" && faaLastChecked && Date.now() - new Date(faaLastChecked).getTime() > 30 * 24 * 60 * 60 * 1000;

  // FAA source - green (fresh) or blue (cached/stale)
  if (source === "faa") {
    return (
      <span
        className={`${padding} ${textSize} rounded inline-flex items-center gap-1 ${
          isStale
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
        }`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {isStale ? "FAA Cached" : "FAA"}
      </span>
    );
  }

  // ForeFlight source - blue badge with circle icon
  if (source === "foreflight") {
    return (
      <span
        className={`${padding} ${textSize} rounded bg-blue-500/20 text-blue-300 border border-blue-500/50 inline-flex items-center gap-1`}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" />
        </svg>
        ForeFlight
      </span>
    );
  }

  return null;
}
