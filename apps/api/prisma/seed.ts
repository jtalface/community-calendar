import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function at(hour: number, minute = 0, addDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + addDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.carpoolRide.deleteMany();
  await prisma.carpoolRequest.deleteMany();
  await prisma.carpoolOffer.deleteMany();
  await prisma.conflict.deleteMany();
  await prisma.externalCalendarEvent.deleteMany();
  await prisma.calendarConnection.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.activitySession.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.friendConnection.deleteMany();
  await prisma.child.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.family.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const alex = await prisma.user.create({
    data: { name: "Alex Rivera", email: "alex.rivera@example.com", passwordHash }
  });
  const mayaParent = await prisma.user.create({
    data: { name: "Priya Shah", email: "priya.shah@example.com", passwordHash }
  });
  const family = await prisma.family.create({
    data: {
      name: "Rivera Family",
      members: { create: [{ userId: alex.id, role: "owner" }] },
      children: {
        create: [
          { name: "Ezra", age: 8, grade: "3rd", school: "Maple Elementary", notes: "Loves STEM and soccer." },
          { name: "Julia", age: 6, grade: "1st", school: "Maple Elementary", notes: "Art, swim, and music." },
          { name: "Leo", age: 10, grade: "5th", school: "Maple Elementary", notes: "Basketball and robotics." }
        ]
      },
      groups: {
        create: [
          { name: "Maple Elementary 3rd Grade", kind: "class", visibility: "class_group" },
          { name: "Saturday Soccer Families", kind: "sports_team", visibility: "friend_group" }
        ]
      }
    },
    include: { children: true, groups: true }
  });

  await prisma.friendConnection.create({
    data: { requesterId: alex.id, recipientId: mayaParent.id, status: "approved", shareAttendance: true }
  });

  await prisma.calendarConnection.createMany({
    data: [
      { userId: alex.id, provider: "google", label: "Alex Work Calendar" },
      { userId: alex.id, provider: "apple", label: "Family iCloud Calendar" }
    ]
  });

  await prisma.externalCalendarEvent.createMany({
    data: [
      { userId: alex.id, provider: "google", title: "Adobe design review", startsAt: at(14, 30, 2), endsAt: at(15, 30, 2) },
      { userId: alex.id, provider: "google", title: "Quarterly planning", startsAt: at(8, 45, 4), endsAt: at(10, 0, 4) }
    ]
  });

  const [ezra, julia, leo] = family.children;

  const robotics = await prisma.activity.create({
    data: {
      familyId: family.id,
      title: "Robotics Camp",
      location: "Innovation Lab, 120 Pine St",
      category: "stem",
      provider: "BrightBots",
      registrationLink: "https://example.com/robotics",
      notes: "Bring lunch and a charged tablet.",
      visibility: "friend_group",
      sessions: { create: { startsAt: at(9, 0, 2), endsAt: at(15, 0, 2), dropoffStartsAt: at(8, 45, 2), pickupEndsAt: at(15, 15, 2) } },
      attendances: { create: [{ childId: ezra.id, shared: true }, { childId: leo.id, shared: true }] }
    },
    include: { sessions: true }
  });

  const art = await prisma.activity.create({
    data: {
      familyId: family.id,
      title: "Watercolor Studio",
      location: "Community Arts Center",
      category: "art",
      provider: "City Arts",
      visibility: "class_group",
      sessions: { create: { startsAt: at(13, 0, 3), endsAt: at(16, 0, 3), dropoffStartsAt: at(12, 45, 3), pickupEndsAt: at(16, 15, 3) } },
      attendances: { create: [{ childId: julia.id, shared: true }] }
    },
    include: { sessions: true }
  });

  await prisma.activity.create({
    data: {
      familyId: family.id,
      title: "Soccer Practice",
      location: "Maple Park Field 2",
      category: "sports",
      provider: "AYSO",
      visibility: "friend_group",
      isRecurring: true,
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,WE",
      sessions: { create: { startsAt: at(17, 0, 1), endsAt: at(18, 15, 1), dropoffStartsAt: at(16, 45, 1), pickupEndsAt: at(18, 25, 1) } },
      attendances: { create: [{ childId: ezra.id, shared: true }] }
    }
  });

  await prisma.conflict.create({
    data: {
      sessionId: robotics.sessions[0].id,
      source: "external_calendar",
      severity: "high",
      title: "Adobe design review",
      message: "Robotics Camp pickup overlaps with Adobe design review",
      startsAt: at(14, 30, 2),
      endsAt: at(15, 0, 2)
    }
  });

  const offer = await prisma.carpoolOffer.create({
    data: {
      sessionId: robotics.sessions[0].id,
      driverId: mayaParent.id,
      direction: "pickup",
      seats: 3,
      pickupLocation: "Innovation Lab curb",
      dropoffLocation: "Maple Elementary",
      notes: "Can take kids back near school."
    }
  });

  await prisma.carpoolRide.create({ data: { offerId: offer.id, childId: ezra.id, status: "approved" } });
  await prisma.carpoolRequest.create({
    data: { sessionId: art.sessions[0].id, requesterId: alex.id, direction: "pickup", seatsNeeded: 1, notes: "Need help after art class." }
  });

  await prisma.notification.createMany({
    data: [
      { userId: alex.id, kind: "conflict", title: "Pickup conflict", body: "Robotics Camp pickup overlaps with Adobe design review." },
      { userId: alex.id, kind: "carpool", title: "2 seats available", body: "Priya has pickup seats for Robotics Camp." }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete. Login with alex.rivera@example.com / password123");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
