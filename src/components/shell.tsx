import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, Volume2, VolumeX, X } from "lucide-react";
import { useEffect } from "react";
import { useGame } from "@/game/store";
import { unlockAudio } from "@/game/sound";
import { cn } from "@/lib/cn";

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
  return (
    <div className="min-h-screen text-paper">
      {!bare && (
        <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
          <Link to="/" className="mr-auto flex items-center gap-3">
            <Seal />
            <span className="font-serif text-2xl leading-none">DẤU</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link to="/" className={cn("rounded-control px-3 py-2 text-sm", path === "/" ? "bg-paper text-ink" : "text-muted hover:text-paper")}>
              Chơi
            </Link>
            <Link to="/library" className={cn("rounded-control px-3 py-2 text-sm", path === "/library" ? "bg-paper text-ink" : "text-muted hover:text-paper")}>
              Tủ đề
            </Link>
            <Link to="/studio" search={{ id: "" }} className={cn("rounded-control px-3 py-2 text-sm", path === "/studio" ? "bg-paper text-ink" : "text-muted hover:text-paper")}>
              Soạn
            </Link>
            <Link to="/history" className={cn("rounded-control px-3 py-2 text-sm", path === "/history" ? "bg-paper text-ink" : "text-muted hover:text-paper")}>
              Ván đã chơi
            </Link>
          </nav>
          <SoundButton />
          <SettingsDialog />
        </header>
      )}
      {!bare && (
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 sm:hidden">
          <Link to="/" className={cn("shrink-0 rounded-control px-3 py-2 text-sm", path === "/" ? "bg-paper text-ink" : "bg-stage-soft text-muted")}>
            Chơi
          </Link>
          <Link to="/library" className={cn("shrink-0 rounded-control px-3 py-2 text-sm", path === "/library" ? "bg-paper text-ink" : "bg-stage-soft text-muted")}>
            Tủ đề
          </Link>
          <Link to="/studio" search={{ id: "" }} className={cn("shrink-0 rounded-control px-3 py-2 text-sm", path === "/studio" ? "bg-paper text-ink" : "bg-stage-soft text-muted")}>
            Soạn
          </Link>
          <Link to="/history" className={cn("shrink-0 rounded-control px-3 py-2 text-sm", path === "/history" ? "bg-paper text-ink" : "bg-stage-soft text-muted")}>
            Ván đã chơi
          </Link>
        </nav>
      )}
      {notice && !bare && (
        <div className="mx-auto mb-2 flex max-w-6xl items-start justify-between gap-3 px-4 text-sm text-gold">
          <p>{notice}</p>
          <button type="button" onClick={clearNotice} className="shrink-0 underline">
            Đóng
          </button>
        </div>
      )}
      <main className={cn("mx-auto px-4 pb-24", wide ? "max-w-6xl" : "max-w-3xl", bare && "max-w-3xl pt-4")}>
        {children}
      </main>
    </div>
  );
}

export function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 place-items-center rounded-full border-2 border-stamp text-xs font-semibold tracking-widest text-stamp",
        className,
      )}
      aria-hidden="true"
    >
      DẤU
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
      className="grid size-11 place-items-center rounded-control bg-stage-soft text-paper"
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
      <Dialog.Trigger className="grid size-11 place-items-center rounded-control bg-stage-soft text-paper" aria-label="Cài đặt">
        <Settings className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/60" />
        <Dialog.Content className="sheet fixed left-1/2 top-1/2 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="font-serif text-3xl text-ink">Cài đặt</Dialog.Title>
            <Dialog.Close className="grid size-11 place-items-center rounded-control bg-paper-2 text-ink" aria-label="Đóng">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-sm text-ink-soft">
            Âm thanh, gợi ý và chuyển động. Mọi thứ chỉ nằm trên máy này.
          </Dialog.Description>
          <label className="mt-6 flex items-center justify-between gap-3 text-ink">
            <span>Tiếng trong ván</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(event) => setSettings({ sound: event.target.checked })}
              className="size-5 accent-stamp"
            />
          </label>
          <label className="mt-4 block text-sm text-ink-soft">
            Âm lượng
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) => setSettings({ volume: Number(event.target.value) / 100 })}
              className="mt-2 w-full accent-gold"
            />
          </label>
          <label className="mt-4 flex items-center justify-between gap-3 text-ink">
            <span>Dùng gợi ý thì trừ 20% điểm câu</span>
            <input
              type="checkbox"
              checked={settings.hintPenalty}
              onChange={(event) => setSettings({ hintPenalty: event.target.checked })}
              className="size-5 accent-stamp"
            />
          </label>
          <label className="mt-4 flex items-center justify-between gap-3 text-ink">
            <span>Giảm chuyển động</span>
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
