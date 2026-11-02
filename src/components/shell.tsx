import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Flame, Gamepad2, History, Library, PenTool, Settings, Trophy, Volume2, VolumeX, X, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useGame } from "@/game/store";
import { unlockAudio } from "@/game/sound";
import { cn } from "@/lib/cn";
import { formatScore } from "@/game/engine";

export function Boot() {
  const hydrate = useGame((s) => s.hydrate);
  const reduced = useGame((s) => s.settings.reducedMotion);
  useEffect(() => {
    hydrate();
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduced);
  }, [reduced]);
  return null;
}

export function usePlayerRank() {
  const records = useGame((s) => s.records);
  return useMemo(() => {
    const totalXP = records.reduce((sum, r) => sum + r.score, 0);
    const totalCorrect = records.reduce((sum, r) => sum + r.correct, 0);
    const bestStreak = records.reduce((m, r) => Math.max(m, r.bestStreak), 0);
    const level = Math.max(1, Math.floor(totalXP / 5000) + 1);
    const currentLevelXP = totalXP % 5000;
    const progressPct = Math.min(100, Math.round((currentLevelXP / 5000) * 100));

    let badge = "Tân Binh";
    let badgeColor = "from-blue-400 to-cyan-400";
    if (level >= 15) {
      badge = "Huyền Thoại GDCD";
      badgeColor = "from-amber-300 via-yellow-400 to-orange-500";
    } else if (level >= 8) {
      badge = "Cao Thủ Đấu Trường";
      badgeColor = "from-pink-500 via-red-500 to-yellow-500";
    } else if (level >= 4) {
      badge = "Chiến Binh Tri Thức";
      badgeColor = "from-purple-400 to-pink-500";
    }

    return {
      totalXP,
      totalCorrect,
      bestStreak,
      level,
      progressPct,
      badge,
      badgeColor,
      gamesPlayed: records.length,
    };
  }, [records]);
}

export function Shell({
  children,
  wide,
  bare,
}: {
  children: React.ReactNode;
  wide?: boolean;
  bare?: boolean;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const notice = useGame((s) => s.notice);
  const clearNotice = useGame((s) => s.clearNotice);
  const rank = usePlayerRank();

  return (
    <div className="min-h-screen text-paper">
      {!bare && (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#12092b]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <Link to="/" className="mr-auto flex items-center gap-3 group">
              <Seal className="transition-transform group-hover:scale-105" />
              <div>
                <span className="block font-serif text-2xl font-black tracking-tight text-white">
                  DẤU <span className="text-gold">ARENA</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">
                  Quizizz & Kahoot Edition
                </span>
              </div>
            </Link>

            {/* Gamified XP & Level Pill */}
            <div className="hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-stage-2/90 px-3.5 py-1.5 md:flex">
              <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-gold to-orange-500 font-black text-gold-ink shadow-sm">
                {rank.level}
              </div>
              <div className="min-w-28">
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", rank.badgeColor)}>
                    {rank.badge}
                  </span>
                  <span className="tabular text-[11px] text-gold">{formatScore(rank.totalXP)} XP</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-stamp transition-all duration-500"
                    style={{ width: `${rank.progressPct}%` }}
                  />
                </div>
              </div>
              {rank.bestStreak > 0 && (
                <div className="ml-1 flex items-center gap-1 rounded-lg bg-orange-500/20 px-2 py-1 text-xs font-extrabold text-orange-400" title="Chuỗi đúng cao nhất">
                  <Flame className="size-3.5 fill-orange-400" />
                  <span className="tabular">{rank.bestStreak}</span>
                </div>
              )}
            </div>

            <nav className="hidden items-center gap-1.5 sm:flex">
              <NavPill to="/" active={path === "/"} icon={<Gamepad2 className="size-4" />} label="Sảnh Chơi" />
              <NavPill to="/library" active={path === "/library"} icon={<Library className="size-4" />} label="Kho Đề" />
              <NavPill to="/studio" active={path === "/studio"} icon={<PenTool className="size-4" />} label="Tạo Đề" search={{ id: "" }} />
              <NavPill to="/history" active={path === "/history"} icon={<History className="size-4" />} label="Kỷ Lục" />
            </nav>

            <SoundButton />
            <SettingsDialog />
          </div>
        </header>
      )}
      {!bare && (
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 sm:hidden">
          <NavPill to="/" active={path === "/"} icon={<Gamepad2 className="size-4" />} label="Sảnh Chơi" />
          <NavPill to="/library" active={path === "/library"} icon={<Library className="size-4" />} label="Kho Đề" />
          <NavPill to="/studio" active={path === "/studio"} icon={<PenTool className="size-4" />} label="Tạo Đề" search={{ id: "" }} />
          <NavPill to="/history" active={path === "/history"} icon={<History className="size-4" />} label="Kỷ Lục" />
        </nav>
      )}
      {notice && !bare && (
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/15 px-4 py-2.5 text-sm font-semibold text-gold">
          <p>⚡ {notice}</p>
          <button type="button" onClick={clearNotice} className="shrink-0 rounded-lg bg-gold/20 px-2.5 py-1 text-xs font-bold hover:bg-gold/30">
            Đóng
          </button>
        </div>
      )}
      <main className={cn("mx-auto px-4 pb-24 pt-6", wide ? "max-w-6xl" : "max-w-3xl", bare && "max-w-4xl pt-4")}>
        {children}
      </main>
    </div>
  );
}

function NavPill({
  to,
  active,
  icon,
  label,
  search,
}: {
  to: "/" | "/library" | "/studio" | "/history";
  active: boolean;
  icon: React.ReactNode;
  label: string;
  search?: { id: string };
}) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all",
        active
          ? "bg-gradient-to-r from-[#ff3355] to-[#ff6b00] text-white shadow-md shadow-[#ff3355]/25"
          : "bg-stage-soft/70 text-muted hover:bg-stage-soft hover:text-white",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff3355] via-[#ff6b00] to-[#ffc800] text-xs font-black tracking-wider text-white shadow-lg shadow-[#ff3355]/30",
        className,
      )}
      aria-hidden="true"
    >
      <Zap className="size-6 fill-white" />
    </span>
  );
}

function SoundButton() {
  const sound = useGame((s) => s.settings.sound);
  const setSettings = useGame((s) => s.setSettings);
  return (
    <button
      type="button"
      aria-label={sound ? "Tắt tiếng" : "Bật tiếng"}
      onClick={() => {
        unlockAudio();
        setSettings({ sound: !sound });
      }}
      className={cn(
        "grid size-10 place-items-center rounded-xl border border-white/10 transition",
        sound ? "bg-stage-soft text-gold" : "bg-stage-2 text-muted",
      )}
    >
      {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
    </button>
  );
}

function SettingsDialog() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  return (
    <Dialog.Root>
      <Dialog.Trigger className="grid size-10 place-items-center rounded-xl border border-white/10 bg-stage-soft text-paper hover:bg-white/15" aria-label="Cài đặt">
        <Settings className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs" />
        <Dialog.Content className="sheet fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-serif text-2xl font-black text-ink">⚙️ Cài đặt phòng thi</Dialog.Title>
            <Dialog.Close className="grid size-10 place-items-center rounded-xl bg-paper-2 text-ink hover:bg-black/10" aria-label="Đóng">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-ink-soft">
            Tuỳ chỉnh hiệu ứng âm thanh, trợ giúp và chuyển động.
          </Dialog.Description>
          <label className="mt-6 flex items-center justify-between gap-3 font-semibold text-ink">
            <span>🔊 Hiệu ứng âm thanh Arcade</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(event) => setSettings({ sound: event.target.checked })}
              className="size-5 accent-stamp"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-ink-soft">
            Mức âm lượng ({Math.round(settings.volume * 100)}%)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) => setSettings({ volume: Number(event.target.value) / 100 })}
              className="mt-2 w-full accent-stamp"
            />
          </label>
          <label className="mt-4 flex items-center justify-between gap-3 font-semibold text-ink">
            <span>💡 Dùng gợi ý trừ 20% điểm câu</span>
            <input
              type="checkbox"
              checked={settings.hintPenalty}
              onChange={(event) => setSettings({ hintPenalty: event.target.checked })}
              className="size-5 accent-stamp"
            />
          </label>
          <label className="mt-4 flex items-center justify-between gap-3 font-semibold text-ink">
            <span>🐢 Giảm hiệu ứng chuyển động</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(event) => setSettings({ reducedMotion: event.target.checked })}
              className="size-5 accent-stamp"
            />
          </label>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export { Trophy };
