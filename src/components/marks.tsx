import type { MarkName } from "@/game/types";

export function Mark({ name, className = "size-12" }: { name?: MarkName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {name === "book" && (
        <>
          <path {...common} d="M8 10h14v28H8a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4zM22 10h14a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H22z" />
          <path {...common} d="M12 18h6M28 18h6M12 24h6M28 24h6" />
        </>
      )}
      {name === "compass" && (
        <>
          <circle {...common} cx="24" cy="24" r="16" />
          <path {...common} d="M24 8v4M24 36v4M8 24h4M36 24h4" />
          <path {...common} d="m24 14 4 10-10 4 6-14z" />
        </>
      )}
      {name === "flame" && <path {...common} d="M24 6c2 8-6 10-6 18a10 10 0 0 0 20 0c0-8-6-8-4-16-4 4-6 4-10-2z" />}
      {name === "leaf" && <path {...common} d="M10 34C14 16 28 8 40 8 38 28 26 38 10 34zM16 30c6-6 12-12 18-16" />}
      {name === "pin" && (
        <>
          <path {...common} d="M24 44V22" />
          <circle {...common} cx="24" cy="14" r="8" />
        </>
      )}
      {name === "bolt" && <path {...common} d="M26 4 10 26h12l-2 18 18-24H26l0-16z" />}
      {name === "drop" && <path {...common} d="M24 6s12 14 12 22a12 12 0 0 1-24 0C12 20 24 6 24 6z" />}
      {(!name || name === "seal") && (
        <>
          <circle {...common} cx="24" cy="24" r="16" />
          <circle {...common} cx="24" cy="24" r="11" />
          <path {...common} d="M18 24.5 22 28l8-9" />
        </>
      )}
    </svg>
  );
}
