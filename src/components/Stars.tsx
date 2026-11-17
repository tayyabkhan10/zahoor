function StarShape({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={`${className} shrink-0`}>
      <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L10 15.1 4.7 18l1.1-6L1.4 7.8l6-.8z" />
    </svg>
  );
}

/** Read-only star rating with partial fill (4.3 shows 4 full stars and a 30% star). */
export default function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block">
            <StarShape className={`${className} text-neutral-300`} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarShape className={`${className} text-amber-500`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
