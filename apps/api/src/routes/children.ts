import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const childrenRouter = Router();

const childSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0).max(18).optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  notes: z.string().optional(),
  privacyDefault: z.enum(["family", "selected_parents", "friend_group", "class_group", "school_group", "public_listing"]).default("family")
});

childrenRouter.get("/", async (req, res, next) => {
  try {
    const children = await prisma.child.findMany({
      where: { familyId: req.user!.familyId },
      orderBy: { createdAt: "asc" }
    });
    res.json(children);
  } catch (error) {
    next(error);
  }
});

childrenRouter.post("/", async (req, res, next) => {
  try {
    const input = childSchema.parse(req.body);
    const child = await prisma.child.create({ data: { ...input, familyId: req.user!.familyId } });
    res.status(201).json(child);
  } catch (error) {
    next(error);
  }
});
