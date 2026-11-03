import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { sfx } from "@/game/sound";

export interface ChaosParticle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  size: number;
}

export function useAdminAbuse(active: boolean) {
  const grant = useGame((s) => s.grant);
  const [screenShake, setScreenShake] = useState(false);
  const [particles, setParticles] = useState<ChaosParticle[]>([]);
  const [siren, setSiren] = useState(false);

  useEffect(() => {
    if (!active) return;

    // Periodically trigger chaos: free items rain, screen shake, score surge
    const interval = setInterval(() => {
      // 1. Shake screen like a warzone explosion
      setScreenShake(true);
      setSiren(true);
      sfx("streak");

      // 2. Generate random flying icons/emojis across screen
      const emojis = ["💣", "⚡", "🎁", "🔥", "👑", "🚀", "💥", "✨"];
      const newParticles: ChaosParticle[] = Array.from({ length: 12 }, (_, i) => ({
        id: Math.random().toString(),
        x: Math.random() * 90 + 5,
        y: Math.random() * 80 + 10,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]!,
        size: Math.floor(Math.random() * 24) + 20,
      }));
      setParticles(newParticles);

      // 3. Grant MASSIVE power-ups silently (no annoying text popups)
      grant({
        items: {
          fifty: Math.random() > 0.4 ? 2 : 1,
          freeze: Math.random() > 0.4 ? 2 : 1,
          double: Math.random() > 0.5 ? 2 : 1,
          shield: Math.random() > 0.6 ? 2 : 1,
          skip: Math.random() > 0.5 ? 2 : 1,
          nuke: Math.random() > 0.7 ? 1 : 0,
          reveal: Math.random() > 0.5 ? 2 : 1,
        },
        score: Math.floor(Math.random() * 1000) + 500,
        double: Math.random() > 0.5 ? 1 : 0,
      });

      // Clear particles and shake
      setTimeout(() => {
        setScreenShake(false);
        setSiren(false);
      }, 1500);

      setTimeout(() => {
        setParticles([]);
      }, 2500);
    }, 7000);

    return () => {
      clearInterval(interval);
    };
  }, [active, grant]);

  return { screenShake, siren, particles };
}

export function AdminAbuseWarzone({
  shake,
  siren,
  particles,
}: {
  shake: boolean;
  siren: boolean;
  particles: ChaosParticle[];
}) {
  return (
    <>
      {/* Red & Blue Siren War Vignette */}
      {siren && (
        <div className="fixed inset-0 pointer-events-none z-40 animate-pulse bg-gradient-to-t from-red-600/25 via-transparent to-purple-600/25" />
      )}

      {/* Explosive flying loot particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
          }}
          className="fixed pointer-events-none z-50 animate-bounce duration-700 select-none drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]"
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
}
