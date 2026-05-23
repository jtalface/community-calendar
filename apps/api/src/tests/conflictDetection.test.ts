import { describe, expect, it } from "vitest";
import { detectConflicts, overlaps } from "../services/conflictDetection.js";

describe("conflict detection", () => {
  it("detects overlapping external calendar events", () => {
    const conflicts = detectConflicts(
      {
        id: "robotics",
        title: "Robotics Camp pickup",
        startsAt: new Date("2026-07-08T22:00:00.000Z"),
        endsAt: new Date("2026-07-08T22:30:00.000Z")
      },
      [{
        id: "work",
        title: "Work meeting",
        source: "external_calendar",
        startsAt: new Date("2026-07-08T21:30:00.000Z"),
        endsAt: new Date("2026-07-08T22:15:00.000Z")
      }]
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].severity).toBe("high");
    expect(conflicts[0].message).toContain("overlaps");
  });

  it("does not treat touching windows as overlapping", () => {
    expect(overlaps(
      { id: "a", title: "A", startsAt: new Date("2026-07-08T10:00:00Z"), endsAt: new Date("2026-07-08T11:00:00Z") },
      { id: "b", title: "B", startsAt: new Date("2026-07-08T11:00:00Z"), endsAt: new Date("2026-07-08T12:00:00Z") }
    )).toBe(false);
  });
});
