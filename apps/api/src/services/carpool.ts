export interface RideLike {
  status: "pending" | "approved" | "declined";
}

export function approvedSeatCount(rides: RideLike[]) {
  return rides.filter((ride) => ride.status === "approved").length;
}

export function remainingSeats(totalSeats: number, rides: RideLike[]) {
  return Math.max(0, totalSeats - approvedSeatCount(rides));
}

export function canApproveRiders(totalSeats: number, rides: RideLike[], requestedSeats = 1) {
  return remainingSeats(totalSeats, rides) >= requestedSeats;
}
