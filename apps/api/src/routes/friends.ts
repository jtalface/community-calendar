import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const friendsRouter = Router();

friendsRouter.get("/", async (req, res, next) => {
  try {
    const [connections, groups] = await Promise.all([
      prisma.friendConnection.findMany({
        where: { OR: [{ requesterId: req.user!.id }, { recipientId: req.user!.id }] },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          recipient: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.group.findMany({ where: { familyId: req.user!.familyId }, include: { members: true } })
    ]);
    res.json({ connections, groups });
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/connections", async (req, res, next) => {
  try {
    const input = z.object({ recipientId: z.string(), childId: z.string().optional() }).parse(req.body);
    const connection = await prisma.friendConnection.create({
      data: { requesterId: req.user!.id, recipientId: input.recipientId, childId: input.childId }
    });
    res.status(201).json(connection);
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/groups", async (req, res, next) => {
  try {
    const input = z.object({
      name: z.string().min(1),
      kind: z.enum(["school", "class", "friends", "sports_team", "neighborhood", "camp", "family"])
    }).parse(req.body);
    const group = await prisma.group.create({ data: { ...input, familyId: req.user!.familyId } });
    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
});
