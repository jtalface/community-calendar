import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { generateIcsCalendar } from "../services/ics.js";

export const exportsRouter = Router();

exportsRouter.get("/ics", async (req, res, next) => {
  try {
    const scope = String(req.query.scope ?? "family");
    const childId = req.query.childId ? String(req.query.childId) : undefined;
    const where: any = { familyId: req.user!.familyId };
    if (scope === "child" && childId) where.attendances = { some: { childId } };
    if (scope === "carpool") where.sessions = { some: { carpoolOffers: { some: {} } } };

    const activities = await prisma.activity.findMany({
      where,
      include: { sessions: true, attendances: { include: { child: true } } }
    });
    const events = activities.flatMap((activity) => activity.sessions.map((session) => ({
      uid: `${session.id}@kidcal.local`,
      title: activity.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      location: activity.location,
      description: activity.notes
    })));
    const ics = generateIcsCalendar(scope === "child" ? "KidCal Child Calendar" : "KidCal Family Calendar", events);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="kidcal-${scope}.ics"`);
    res.send(ics);
  } catch (error) {
    next(error);
  }
});
