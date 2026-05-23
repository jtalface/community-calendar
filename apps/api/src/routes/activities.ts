import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { detectConflicts } from "../services/conflictDetection.js";

export const activitiesRouter = Router();

const activitySchema = z.object({
  title: z.string().min(1),
  childIds: z.array(z.string()).min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  location: z.string().min(1),
  category: z.enum(["camp", "sports", "school", "music", "stem", "art", "playdate", "doctor", "travel", "other"]),
  provider: z.string().optional(),
  registrationLink: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  visibility: z.enum(["family", "selected_parents", "friend_group", "class_group", "school_group", "public_listing"]).default("family"),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional()
});

async function validateFamilyChildren(childIds: string[], familyId: string) {
  const requestedChildIds = [...new Set(childIds)];
  const validChildren = await prisma.child.findMany({
    where: { id: { in: requestedChildIds }, familyId },
    select: { id: true }
  });

  if (validChildren.length === requestedChildIds.length) {
    return { ok: true as const, childIds: requestedChildIds };
  }

  const validChildIds = new Set(validChildren.map((child) => child.id));
  const invalidChildIds = requestedChildIds.filter((childId) => !validChildIds.has(childId));
  return { ok: false as const, invalidChildIds };
}

activitiesRouter.get("/", async (req, res, next) => {
  try {
    const { childId, category, weekStart, location } = req.query;
    const where: any = { familyId: req.user!.familyId };
    if (category) where.category = category;
    if (location) where.location = { contains: String(location), mode: "insensitive" };
    if (childId) where.attendances = { some: { childId: String(childId) } };
    if (weekStart) {
      const start = new Date(String(weekStart));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      where.sessions = { some: { startsAt: { gte: start, lt: end } } };
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        sessions: { include: { conflicts: true, carpoolOffers: { include: { rides: true } }, carpoolRequests: true } },
        attendances: { include: { child: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

activitiesRouter.post("/", async (req, res, next) => {
  try {
    const input = activitySchema.parse(req.body);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) {
      return res.status(400).json({ error: "Activity end time must be after start time" });
    }

    const childValidation = await validateFamilyChildren(input.childIds, req.user!.familyId);
    if (!childValidation.ok) {
      return res.status(400).json({
        error: "One or more children do not belong to this family",
        details: { invalidChildIds: childValidation.invalidChildIds }
      });
    }

    const activity = await prisma.activity.create({
      data: {
        familyId: req.user!.familyId,
        title: input.title,
        location: input.location,
        category: input.category,
        provider: input.provider,
        registrationLink: input.registrationLink || null,
        notes: input.notes,
        visibility: input.visibility,
        isRecurring: input.isRecurring,
        recurrenceRule: input.recurrenceRule,
        sessions: { create: { startsAt, endsAt, dropoffStartsAt: startsAt, pickupEndsAt: endsAt } },
        attendances: { create: childValidation.childIds.map((childId) => ({ childId, shared: input.visibility !== "family" })) }
      },
      include: { sessions: true, attendances: { include: { child: true } } }
    });

    const externalEvents = await prisma.externalCalendarEvent.findMany({
      where: { userId: req.user!.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }
    });
    const [session] = activity.sessions;
    const conflicts = detectConflicts(
      { id: session.id, title: activity.title, startsAt, endsAt },
      externalEvents.map((event) => ({ ...event, source: "external_calendar" as const }))
    );
    if (conflicts.length) {
      await prisma.conflict.createMany({
        data: conflicts.map((conflict) => ({
          sessionId: session.id,
          title: conflict.title,
          source: conflict.source,
          severity: conflict.severity,
          message: conflict.message,
          startsAt: conflict.startsAt,
          endsAt: conflict.endsAt
        }))
      });
    }

    const created = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: { sessions: { include: { conflicts: true } }, attendances: { include: { child: true } } }
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

activitiesRouter.put("/:id", async (req, res, next) => {
  try {
    const input = activitySchema.partial().parse(req.body);
    const existing = await prisma.activity.findFirst({
      where: { id: req.params.id, familyId: req.user!.familyId },
      include: { sessions: { orderBy: { startsAt: "asc" } } }
    });
    if (!existing) return res.status(404).json({ error: "Activity not found" });

    const startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if (startsAt && endsAt && endsAt <= startsAt) {
      return res.status(400).json({ error: "Activity end time must be after start time" });
    }

    const childValidation = input.childIds ? await validateFamilyChildren(input.childIds, req.user!.familyId) : undefined;
    if (childValidation && !childValidation.ok) {
      return res.status(400).json({
        error: "One or more children do not belong to this family",
        details: { invalidChildIds: childValidation.invalidChildIds }
      });
    }

    const activity = await prisma.$transaction(async (tx) => {
      const updated = await tx.activity.update({
        where: { id: existing.id },
        data: {
          title: input.title,
          location: input.location,
          category: input.category,
          provider: input.provider,
          registrationLink: input.registrationLink === undefined ? undefined : input.registrationLink || null,
          notes: input.notes,
          visibility: input.visibility,
          isRecurring: input.isRecurring,
          recurrenceRule: input.recurrenceRule
        }
      });

      const session = existing.sessions[0];
      if (session && (startsAt || endsAt)) {
        await tx.activitySession.update({
          where: { id: session.id },
          data: {
            startsAt,
            endsAt,
            dropoffStartsAt: startsAt,
            pickupEndsAt: endsAt
          }
        });
        await tx.conflict.deleteMany({ where: { sessionId: session.id } });
      }

      if (childValidation?.ok) {
        await tx.attendance.deleteMany({ where: { activityId: existing.id } });
        await tx.attendance.createMany({
          data: childValidation.childIds.map((childId) => ({
            activityId: existing.id,
            childId,
            shared: (input.visibility ?? existing.visibility) !== "family"
          }))
        });
      }

      return updated;
    });

    const updated = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: { sessions: { include: { conflicts: true, carpoolOffers: { include: { rides: true } } } }, attendances: { include: { child: true } } }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

activitiesRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id, familyId: req.user!.familyId } });
    if (!existing) return res.status(404).json({ error: "Activity not found" });
    await prisma.activity.delete({ where: { id: existing.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
