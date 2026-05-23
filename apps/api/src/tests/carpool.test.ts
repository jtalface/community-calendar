import { describe, expect, it } from "vitest";
import { approvedSeatCount, canApproveRiders, remainingSeats } from "../services/carpool.js";

describe("carpool seat logic", () => {
  const rides = [
    { status: "approved" as const },
    { status: "pending" as const },
    { status: "approved" as const }
  ];

  it("counts only approved riders against capacity", () => {
    expect(approvedSeatCount(rides)).toBe(2);
    expect(remainingSeats(3, rides)).toBe(1);
  });

  it("blocks approvals when seats are full", () => {
    expect(canApproveRiders(2, rides)).toBe(false);
    expect(canApproveRiders(3, rides)).toBe(true);
  });
});
