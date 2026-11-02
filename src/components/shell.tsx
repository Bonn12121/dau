import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";
import { DauIcon } from "@/components/marks";
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
        <header className="border-b border-line bg-stage-2/80">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link to="/" className="mr-auto flex items-center gap-2.5">
              <Seal />
              <span className="font-serif text-xl font-extrabold tracking-tight text-white">DẤU</span>
            </Link>

            <nav className="hidden items-center gap-1 sm:flex">
              <NavTab to="/" active={path === "/"} label="Chơi" />
              <NavTab to="/library" active={path === "/library"} label="Tủ đề" />
              <NavTab to="/studio" active={path === "/studio"} label="Soạn" search={{ id: "" }} />
              <NavTab to="/history" active={path === "/history"} label="Lịch sử" />
            </nav>

            <SoundButton />
            <SettingsDialog />
          </div>
        </header>
      )}
      {!bare && (
        <nav className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 py-2 sm:hidden">
          <NavTab to="/" active={path === "/"} label="Chơi" />
          <NavTab to="/library" active={path === "/library"} label="Tủ đề" />
          <NavTab to="/studio" active={path === "/studio"} label="Soạn" search={{ id: "" }} />
          <NavTab to="/history" active={path === "/history"} label="Lịch sử" />
        </nav>
      )}
      {notice && !bare && (
        <div className="mx-auto mt-3 flex max-w-5xl items-center justify-between gap-3 rounded-control bg-stage-soft px-4 py-2.5 text-sm text-gold">
          <p>{notice}</p>
          <button type="button" onClick={clearNotice} className="shrink-0 text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}
      <main className={cn("mx-auto px-4 pb-20 pt-6", wide ? "max-w-5xl" : "max-w-3xl", bare && "max-w-3xl pt-4")}>
        {children}
      </main>
    </div>
  );
}

function NavTab({
  to,
  active,
  label,
  search,
}: {
  to: "/" | "/library" | "/studio" | "/history";
  active: boolean;
  label: string;
  search?: { id: string };
}) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "shrink-0 rounded-control px-3.5 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-paper text-ink" : "text-muted hover:bg-stage-soft hover:text-white",
      )}
    >
      {label}
    </Link>
  );
}

export function Seal({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 place-items-center rounded-xl bg-stamp text-xs font-extrabold text-white",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 9v11h16V9l-8-6Z" />
        <path d="m9.5 14 2 2 4-4" />
      </svg>
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
        "grid size-9 place-items-center rounded-control transition",
        sound ? "bg-stage-soft text-white" : "bg-stage-2 text-muted",
      )}
    >
      <DauIcon name={sound ? "sound-on" : "sound-off"} className="size-4" />
    </button>
  );
}

function SettingsDialog() {
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  return (
    <Dialog.Root>
      <Dialog.Trigger className="grid size-9 place-items-center rounded-control bg-stage-soft text-white" aria-label="Cài đặt">
        <DauIcon name="settings" className="size-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="sheet fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-serif text-xl font-bold text-ink">Cài đặt</Dialog.Title>
            <Dialog.Close className="grid size-9 place-items-center rounded-control bg-paper-2 text-ink" aria-label="Đóng">
              <DauIcon name="close" className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-xs text-ink-soft">
            Âm thanh và chuyển động trên thiết bị này.
          </Dialog.Description>
          <label className="mt-5 flex items-center justify-between gap-3 text-sm font-medium text-ink">
            <span>Âm thanh khi chơi</span>
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(event) => setSettings({ sound: event.target.checked })}
              className="size-4 accent-stamp"
            />
          </label>
          <label className="mt-4 block text-xs font-medium text-ink-soft">
            Âm lượng ({Math.round(settings.volume * 100)}%)
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(event) => setSettings({ volume: Number(event.target.value) / 100 })}
              className="mt-1.5 w-full accent-stamp"
            />
          </label>
          <label className="mt-4 flex items-center justify-between gap-3 text-sm font-medium text-ink">
            <span>Giảm chuyển động</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(event) => setSettings({ reducedMotion: event.target.checked })}
              className="size-4 accent-stamp"
            />
          </label>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
