/** TopRank vision board: exam tracks, goal copy, dream-college heuristics (illustrative, not admission advice). */

export const TOPRANK_EXAM_TRACKS = [
  { id: "NEET", label: "NEET (UG)" },
  { id: "JEE_MAIN", label: "JEE Main" },
  { id: "JEE_ADV", label: "JEE Advanced" },
  { id: "CUET", label: "CUET" },
  { id: "STATE_PMT", label: "State medical / CET" },
  { id: "CBSE_BOARDS", label: "Boards (Class 12)" },
  { id: "OTHER", label: "Other competitive exam" },
] as const;

export type TopRankExamTrackId = (typeof TOPRANK_EXAM_TRACKS)[number]["id"];

export function isValidExamTrack(id: string): id is TopRankExamTrackId {
  return TOPRANK_EXAM_TRACKS.some((t) => t.id === id);
}

export function formatGoalCardLine(trackId: string, targetRank: number, targetDate: Date): string {
  const label = TOPRANK_EXAM_TRACKS.find((t) => t.id === trackId)?.label ?? trackId;
  const y = targetDate.getUTCFullYear();
  const m = targetDate.toLocaleString("en-IN", { month: "short", timeZone: "UTC" });
  return `AIR ${targetRank.toLocaleString("en-IN")} · ${label} · ${m} ${y}`;
}

/**
 * Heuristic “dream college” line from rank band — motivational anchor only.
 */
export function dreamCollegeForRank(trackId: string, rank: number): string {
  const r = Math.max(1, rank);

  if (trackId === "NEET" || trackId === "STATE_PMT") {
    if (r <= 50) return "All India Institute of Medical Sciences (premier tier)";
    if (r <= 500) return "Top national medical institute / state apex college";
    if (r <= 2500) return "Strong GMC / reputed state quota seat";
    if (r <= 8000) return "Solid clinical programme — targeted state counselling";
    return "Mission-driven MBBS path — rebuild mock trajectory to widen options";
  }

  if (trackId === "JEE_MAIN" || trackId === "JEE_ADV") {
    if (r <= 500) return "Indian Institute of Technology — top-five department zone";
    if (r <= 2500) return "IIT / NIT flagship branch (core engineering)";
    if (r <= 10000) return "NIT / IIIT strong circuit — branch optimisation";
    return "Tier-1 engineering pipeline — tighten fundamentals to expand choices";
  }

  if (trackId === "CUET") {
    if (r <= 1000) return "Central university honours / research track";
    return "Premier central programme — consistency unlocks campus tier";
  }

  if (trackId === "CBSE_BOARDS") {
    return "95+ territory — unlocks dual pathway (boards + competitive)";
  }

  return "Premier programme matching your.rank band — own the daily loop";
}
