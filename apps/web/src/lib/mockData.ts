const today = new Date();

function iso(hour: number, addDays = 0) {
  const date = new Date(today);
  date.setDate(today.getDate() + addDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const fallbackDashboard = {
  children: [
    { id: "ezra", name: "Ezra", age: 8, grade: "3rd", school: "Maple Elementary" },
    { id: "julia", name: "Julia", age: 6, grade: "1st", school: "Maple Elementary" },
    { id: "leo", name: "Leo", age: 10, grade: "5th", school: "Maple Elementary" }
  ],
  activities: [
    {
      id: "robotics",
      title: "Robotics Camp",
      location: "Innovation Lab",
      category: "stem",
      visibility: "friend_group",
      attendances: [{ child: { name: "Ezra" } }, { child: { name: "Leo" } }],
      sessions: [{
        id: "s1",
        startsAt: iso(9, 2),
        endsAt: iso(15, 2),
        conflicts: [{ id: "c1", severity: "high", message: "Pickup overlaps with Adobe design review" }],
        carpoolOffers: [{ id: "o1", seats: 3, rides: [{ status: "approved" }] }]
      }]
    },
    {
      id: "art",
      title: "Watercolor Studio",
      location: "Community Arts Center",
      category: "art",
      visibility: "class_group",
      attendances: [{ child: { name: "Julia" } }],
      sessions: [{ id: "s2", startsAt: iso(13, 3), endsAt: iso(16, 3), conflicts: [], carpoolOffers: [] }]
    },
    {
      id: "soccer",
      title: "Soccer Practice",
      location: "Maple Park Field 2",
      category: "sports",
      visibility: "friend_group",
      attendances: [{ child: { name: "Ezra" } }],
      sessions: [{ id: "s3", startsAt: iso(17, 1), endsAt: iso(18, 1), conflicts: [], carpoolOffers: [] }]
    }
  ],
  conflicts: [
    { id: "c1", title: "Adobe design review", severity: "high", message: "Robotics Camp pickup overlaps with Adobe design review" }
  ],
  carpoolOffers: [
    { id: "o1", direction: "pickup", seats: 3, remainingSeats: 2, driver: { name: "Priya Shah" }, session: { activity: { title: "Robotics Camp" } } }
  ],
  friendsAttending: [
    { childName: "Ezra", activityTitle: "Robotics Camp", visibility: "friend_group" },
    { childName: "Julia", activityTitle: "Watercolor Studio", visibility: "class_group" }
  ]
};
