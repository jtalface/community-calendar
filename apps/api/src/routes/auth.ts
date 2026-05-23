import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  familyName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        familyMembers: {
          create: {
            role: "owner",
            family: { create: { name: input.familyName } }
          }
        }
      },
      include: { familyMembers: true }
    });
    const member = user.familyMembers[0];
    res.status(201).json({
      token: signToken({ id: user.id, familyId: member.familyId, role: member.role }),
      user: { id: user.id, name: user.name, email: user.email, familyId: member.familyId, role: member.role }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { familyMembers: true }
    });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const member = user.familyMembers[0];
    res.json({
      token: signToken({ id: user.id, familyId: member.familyId, role: member.role }),
      user: { id: user.id, name: user.name, email: user.email, familyId: member.familyId, role: member.role }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, familyMembers: { select: { role: true, family: true } } }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});
