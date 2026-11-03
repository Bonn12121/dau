import { useState, useEffect } from "react";
import { checkNameAvailable, getCurrentUsername, setCurrentUsername } from "@/lib/leaderboard";
import { cn } from "@/lib/cn";

export function NamePromptModal({
  open,
  quizId,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  quizId: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(getCurrentUsername());
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (trimmed.length > 20) {
      setError("Tên tối đa 20 ký tự");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const available = await checkNameAvailable(trimmed, quizId);
      if (!available) {
        setError(`Tên "${trimmed}" đã có người đặt trên bảng xếp hạng! Hãy chọn tên khác.`);
        setLoading(false);
        return;
      }

      setCurrentUsername(trimmed);
      onConfirm(trimmed);
    } catch {
      // Fallback allow
      setCurrentUsername(trimmed);
      onConfirm(trimmed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="sheet relative w-full max-w-md p-6 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👤</span>
          <h2 className="font-serif text-2xl font-black text-white">Nhập tên người chơi</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Không cần tài khoản! Chỉ cần một biệt danh độc nhất để ghi tên lên Bảng Xếp Hạng trực tiếp. Nếu tên đã có người đặt, hệ thống sẽ yêu cầu đổi tên khác.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Tên / Biệt danh của bạn
            </label>
            <input
              type="text"
              autoFocus
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="VD: Minh Anh, ProPlayer..."
              className={cn(
                "w-full rounded-xl bg-stage-2 px-4 py-3 text-base font-bold text-white outline-none border transition",
                error ? "border-stamp focus:border-stamp" : "border-white/10 focus:border-gold"
              )}
            />
            {error && <p className="mt-1.5 text-xs font-semibold text-stamp">{error}</p>}
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl bg-stage-2 py-3 text-sm font-bold text-muted hover:text-white transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 rounded-xl bg-gold py-3 text-sm font-black text-ink hover:opacity-95 transition disabled:opacity-50"
            >
              {loading ? "Đang kiểm tra..." : "Vào ván đấu →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
