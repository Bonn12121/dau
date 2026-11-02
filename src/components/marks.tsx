import type { MarkName } from "@/game/types";

export function Mark({ name, className = "size-12" }: { name?: MarkName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
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

/**
 * Custom Geometric SVGs for Answer Tiles (0..5)
 */
export function ChoiceGlyph({
  index,
  state,
  className = "size-5",
}: {
  index: number;
  state: "idle" | "picked" | "good" | "bad" | "dim";
  className?: string;
}) {
  if (state === "good") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5 10 17.5 19 6.5" />
      </svg>
    );
  }
  if (state === "bad") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  const slot = index % 4;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      {slot === 0 && <path d="M12 3.5 21 19.5H3L12 3.5Z" />}
      {slot === 1 && <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5Z" />}
      {slot === 2 && <circle cx="12" cy="12" r="8.5" />}
      {slot === 3 && <rect x="4" y="4" width="16" height="16" rx="3" />}
    </svg>
  );
}

/**
 * Custom SVG Icons for Game Modes & HUD
 */
export function DauIcon({
  name,
  className = "size-5",
}: {
  name: "classic" | "time" | "survival" | "endless" | "streak" | "fifty" | "freeze" | "hint" | "sound-on" | "sound-off" | "settings" | "close";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "classic" && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </>
      )}
      {name === "time" && (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M9 2h6" />
        </>
      )}
      {name === "survival" && (
        <path fill="currentColor" stroke="none" d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 3.1c0 5.6-7.5 10.2-7.5 10.2Z" />
      )}
      {name === "endless" && (
        <path d="M18.2 8c-2 0-3.4 1.5-6.2 4-2.8 2.5-4.2 4-6.2 4a4 4 0 0 1 0-8c2 0 3.4 1.5 6.2 4 2.8 2.5 4.2 4 6.2 4a4 4 0 0 0 0-8Z" />
      )}
      {name === "streak" && (
        <path fill="currentColor" stroke="none" d="M13.5 2 5 13.5h6L9.5 22 19 10.5h-6L13.5 2Z" />
      )}
      {name === "fifty" && (
        <>
          <circle cx="7" cy="7" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M18 6 6 18" />
        </>
      )}
      {name === "freeze" && (
        <>
          <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
        </>
      )}
      {name === "hint" && (
        <>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
        </>
      )}
      {name === "sound-on" && (
        <>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
        </>
      )}
      {name === "sound-off" && (
        <>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="m21 9-6 6M15 9l6 6" />
        </>
      )}
      {name === "settings" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      )}
      {name === "close" && <path d="M6 6l12 12M18 6 6 18" />}
    </svg>
  );
}
