import { supabase } from "@/lib/supabase";

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  quiz_id: string;
  mode: string;
  streak: number;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = "dau_leaderboard_local";
const CURRENT_USER_KEY = "dau_current_username";

export function getCurrentUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CURRENT_USER_KEY) || "";
}

export function setCurrentUsername(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_USER_KEY, name.trim());
}

export function getLocalLeaderboard(quizId: string): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const all: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    return all
      .filter((e) => e.quiz_id === quizId)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  } catch {
    return [];
  }
}

export async function checkNameAvailable(name: string, quizId: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;

  const client = supabase();
  if (client) {
    try {
      const { data, error } = await client
        .from("leaderboard")
        .select("name")
        .eq("quiz_id", quizId)
        .ilike("name", trimmed)
        .limit(1);

      if (!error && data && data.length > 0) {
        // Name is taken unless it's current user themselves
        const current = getCurrentUsername();
        return current.toLowerCase() === trimmed.toLowerCase();
      }
    } catch {
      // Fallback to local check
    }
  }

  // Fallback / local storage check
  const local = getLocalLeaderboard(quizId);
  const exists = local.some(
    (e) => e.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    const current = getCurrentUsername();
    return current.toLowerCase() === trimmed.toLowerCase();
  }
  return true;
}

export async function fetchLeaderboard(quizId: string): Promise<LeaderboardEntry[]> {
  const client = supabase();
  if (client) {
    try {
      const { data, error } = await client
        .from("leaderboard")
        .select("*")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false })
        .limit(30);

      if (!error && data) {
        return data as LeaderboardEntry[];
      }
    } catch {
      // Ignore and use local
    }
  }
  return getLocalLeaderboard(quizId);
}

export async function recordScore(entry: {
  name: string;
  score: number;
  quiz_id: string;
  mode: string;
  streak: number;
}): Promise<{ rank: number; previousRank: number | null }> {
  const trimmed = entry.name.trim();
  if (!trimmed) return { rank: 1, previousRank: null };

  let previousRank: number | null = null;
  const client = supabase();

  if (client) {
    try {
      // Get current list to find prev rank
      const { data: before } = await client
        .from("leaderboard")
        .select("name, score")
        .eq("quiz_id", entry.quiz_id)
        .order("score", { ascending: false });

      if (before) {
        const foundIdx = before.findIndex((r) => r.name.toLowerCase() === trimmed.toLowerCase());
        if (foundIdx !== -1) previousRank = foundIdx + 1;
      }

      // Upsert
      await client.from("leaderboard").upsert(
        {
          name: trimmed,
          score: entry.score,
          quiz_id: entry.quiz_id,
          mode: entry.mode,
          streak: entry.streak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name,quiz_id" }
      );

      // Re-fetch to calculate new rank
      const { data: after } = await client
        .from("leaderboard")
        .select("name")
        .eq("quiz_id", entry.quiz_id)
        .order("score", { ascending: false });

      if (after) {
        const newIdx = after.findIndex((r) => r.name.toLowerCase() === trimmed.toLowerCase());
        return { rank: newIdx !== -1 ? newIdx + 1 : 1, previousRank };
      }
    } catch {
      // Fallback to local
    }
  }

  // Local storage management
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    
    // Seed some mock classmates if empty so top ranks feel real & exciting!
    if (list.filter((x) => x.quiz_id === entry.quiz_id).length === 0) {
      list.push(
        { id: "1", name: "Minh Anh", score: 8500, quiz_id: entry.quiz_id, mode: entry.mode, streak: 8, updated_at: "" },
        { id: "2", name: "Đức Huy", score: 6200, quiz_id: entry.quiz_id, mode: entry.mode, streak: 5, updated_at: "" },
        { id: "3", name: "Khánh Linh", score: 4500, quiz_id: entry.quiz_id, mode: entry.mode, streak: 4, updated_at: "" },
        { id: "4", name: "Bảo Nam", score: 3000, quiz_id: entry.quiz_id, mode: entry.mode, streak: 2, updated_at: "" }
      );
    }

    const filtered = list.filter((e) => e.quiz_id === entry.quiz_id).sort((a, b) => b.score - a.score);
    const existingIdx = filtered.findIndex((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    if (existingIdx !== -1) {
      previousRank = existingIdx + 1;
      filtered[existingIdx] = {
        id: filtered[existingIdx]!.id,
        name: trimmed,
        score: Math.max(filtered[existingIdx]!.score, entry.score),
        quiz_id: entry.quiz_id,
        mode: entry.mode,
        streak: Math.max(filtered[existingIdx]!.streak, entry.streak),
        updated_at: new Date().toISOString(),
      };
    } else {
      filtered.push({
        id: Math.random().toString(),
        name: trimmed,
        score: entry.score,
        quiz_id: entry.quiz_id,
        mode: entry.mode,
        streak: entry.streak,
        updated_at: new Date().toISOString(),
      });
    }

    filtered.sort((a, b) => b.score - a.score);
    const newIdx = filtered.findIndex((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    
    // Save merged list
    const otherQuizzes = list.filter((e) => e.quiz_id !== entry.quiz_id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...otherQuizzes, ...filtered]));

    return { rank: newIdx !== -1 ? newIdx + 1 : 1, previousRank };
  } catch {
    return { rank: 1, previousRank: null };
  }
}
