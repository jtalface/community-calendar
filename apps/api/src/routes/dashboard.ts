import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { remainingSeats } from "../services/carpool.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const [children, activities, conflicts, carpoolOffers, sharedAttendances] = await Promise.all([
      prisma.child.findMany({ where: { familyId: req.user!.familyId } }),
      prisma.activity.findMany({
        where: { familyId: req.user!.familyId, sessions: { some: { startsAt: { gte: weekStart, lt: weekEnd } } } },
        include: { sessions: { include: { conflicts: true, carpoolOffers: { include: { rides: true } } } }, attendances: { include: { child: true } } }
      }),
      prisma.conflict.findMany({
        where: { session: { activity: { familyId: req.user!.familyId } } },
        include: { session: { include: { activity: true } } },
        take: 8,
        orderBy: { startsAt: "asc" }
      }),
      prisma.carpoolOffer.findMany({
        where: { session: { activity: { familyId: req.user!.familyId } } },
        include: { rides: true, session: { include: { activity: true } }, driver: { select: { name: true } } },
        take: 8
      }),
      prisma.attendance.findMany({
        where: { shared: true, activity: { familyId: req.user!.familyId } },
        include: { child: true, activity: true },
        take: 10
      })
    ]);

    res.json({
      children,
      activities,
      conflicts,
      carpoolOffers: carpoolOffers.map((offer) => ({ ...offer, remainingSeats: remainingSeats(offer.seats, offer.rides) })),
      friendsAttending: sharedAttendances.map((attendance) => ({
        childName: attendance.child.name,
        activityTitle: attendance.activity.title,
        visibility: attendance.activity.visibility
      }))
    });
  } catch (error) {
    next(error);
  }
});
