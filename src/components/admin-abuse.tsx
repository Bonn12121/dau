import { useEffect, useState } from "react";
import { DauIcon } from "@/components/marks";
import { useGame } from "@/game/store";
import { sfx } from "@/game/sound";

const ANNOUNCEMENTS = [
  "free items for all :)",
  "W admin abuse?",
  "admin đang vui tính: tặng free 50/50 & Dừng giờ!",
  "server lag quá, admin đền bù x2 điểm!",
  "ai bấm đúng câu này nhận quà đặc biệt!",
  "admin abuse is real haha",
  "W admin abuse? Chat W trong tim đi các bạn!",
  "cơn mưa vật phẩm từ admin 🎁",
  "admin vừa bấm nhầm nút ban phước...",
];

export function useAdminAbuse(active: boolean) {
  const grant = useGame((s) => s.grant);
  const [currentText, setCurrentText] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    let textTimer: NodeJS.Timeout;
    let nextTextTimer: NodeJS.Timeout;

    // Periodically trigger abuse events every 12 - 20 seconds
    const interval = setInterval(() => {
      // Pick random announcement pair
      const firstText = Math.random() > 0.5 ? "free items for all :)" : ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)]!;
      const secondText = Math.random() > 0.5 ? "W admin abuse?" : ANNOUNCEMENTS[Math.floor(Math.random() * ANNOUNCEMENTS.length)]!;

      // Drop free items & boost score
      grant({
        items: {
          fifty: Math.random() > 0.5 ? 1 : 2,
          freeze: Math.random() > 0.5 ? 1 : 2,
          double: Math.random() > 0.6 ? 1 : 0,
          shield: Math.random() > 0.7 ? 1 : 0,
        },
        score: Math.floor(Math.random() * 500) + 200,
        double: Math.random() > 0.7 ? 1 : 0,
      });

      sfx("streak");
      setCurrentText(firstText);

      // Disappear after 2.5s and 2-3s later show follow-up text
      textTimer = setTimeout(() => {
        setCurrentText(null);

        nextTextTimer = setTimeout(() => {
          setCurrentText(secondText);
          sfx("tap");

          setTimeout(() => {
            setCurrentText(null);
          }, 2500);
        }, 2200);
      }, 2500);
    }, 14000);

    return () => {
      clearInterval(interval);
      clearTimeout(textTimer);
      clearTimeout(nextTextTimer);
    };
  }, [active, grant]);

  return { currentText };
}

export function AdminAbuseBanner({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-2 rounded-2xl border border-purple-500/50 bg-black/85 px-6 py-2.5 shadow-2xl backdrop-blur-md">
        <span className="text-xl animate-spin">👑</span>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">ADMIN EVENT</span>
          <span className="text-base font-extrabold text-white tracking-wide">{text}</span>
        </div>
      </div>
    </div>
  );
}
