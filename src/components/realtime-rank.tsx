import { useEffect, useState } from "react";
import { fetchLeaderboard, getCurrentUsername, recordScore } from "@/lib/leaderboard";
import { formatScore } from "@/game/engine";
import { DauIcon } from "@/components/marks";
import { cn } from "@/lib/cn";

export function useRealtimeRank(quizId: string, currentScore: number, streak: number, mode: string) {
  const [rank, setRank] = useState<number | null>(null);
  const [overtakeRank, setOvertakeRank] = useState<number | null>(null);
  const [showOvertake, setShowOvertake] = useState(false);

  // Sync score and compute rank
  useEffect(() => {
    const username = getCurrentUsername();
    if (!username) return;

    let active = true;
    recordScore({
      name: username,
      score: currentScore,
      quiz_id: quizId,
      mode,
      streak,
    }).then(({ rank: newRank, previousRank }) => {
      if (!active) return;
      if (previousRank !== null && newRank < previousRank) {
        // Player overtook others!
        setOvertakeRank(newRank);
        setShowOvertake(true);
      }
      setRank(newRank);
    });

    return () => {
      active = false;
    };
  }, [quizId, currentScore, streak, mode]);

  // Auto-hide overtake screen after 5s
  useEffect(() => {
    if (!showOvertake) return;
    const timer = setTimeout(() => {
      setShowOvertake(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showOvertake]);

  return {
    rank,
    showOvertake,
    overtakeRank,
    dismissOvertake: () => setShowOvertake(false),
  };
}

export function RankPill({ rank }: { rank: number | null }) {
  const username = getCurrentUsername();
  if (!username || rank === null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-wider transition-all",
        rank === 1
          ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 animate-pulse"
          : rank <= 3
          ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
          : "bg-stage-2 text-white/80 border border-white/10"
      )}
    >
      <span className="text-sm">{rank === 1 ? "👑" : rank <= 3 ? "🏆" : "⚡"}</span>
      <span>TOP #{rank}</span>
      <span className="text-[10px] text-muted opacity-80 max-w-[70px] truncate">({username})</span>
    </div>
  );
}

export function OvertakeScreen({
  rank,
  onContinue,
}: {
  rank: number | null;
  onContinue: () => void;
}) {
  const username = getCurrentUsername();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onContinue();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="sheet relative w-full max-w-md p-8 text-center rounded-3xl border-2 border-gold/40 shadow-2xl bg-radial from-stage-soft via-stage-2 to-black">
        <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-gold/20 text-4xl animate-bounce">
          🔥
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-gold">VƯỢT THÀNH TÍCH!</p>
        <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-extrabold text-white">
          Bạn vừa lên TOP #{rank}!
        </h2>
        <p className="mt-2 text-sm text-muted">
          Chúc mừng <span className="font-bold text-white">{username}</span>! Bạn vừa vượt qua các đối thủ trên bảng xếp hạng thời gian thực.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl bg-gold py-3.5 text-base font-black text-ink shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition"
          >
            Tiếp tục ngay ({seconds}s)
          </button>
        </div>
      </div>
    </div>
  );
}
