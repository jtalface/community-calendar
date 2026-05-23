export interface TimeWindow {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ConflictCandidate extends TimeWindow {
  source: "external_calendar" | "sibling_activity" | "travel_time" | "parent_unavailable";
}

export interface DetectedConflict {
  id: string;
  title: string;
  source: ConflictCandidate["source"];
  severity: "low" | "medium" | "high";
  startsAt: Date;
  endsAt: Date;
  message: string;
}

export function overlaps(a: TimeWindow, b: TimeWindow) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

export function detectConflicts(session: TimeWindow, candidates: ConflictCandidate[]): DetectedConflict[] {
  return candidates.filter((candidate) => overlaps(session, candidate)).map((candidate) => {
    const severity = candidate.source === "external_calendar" ? "high" : "medium";
    return {
      id: `${session.id}:${candidate.id}`,
      title: candidate.title,
      source: candidate.source,
      severity,
      startsAt: candidate.startsAt > session.startsAt ? candidate.startsAt : session.startsAt,
      endsAt: candidate.endsAt < session.endsAt ? candidate.endsAt : session.endsAt,
      message: `${session.title} overlaps with ${candidate.title}`
    };
  });
}
