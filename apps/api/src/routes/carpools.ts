import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { canApproveRiders, remainingSeats } from "../services/carpool.js";

export const carpoolsRouter = Router();

const offerSchema = z.object({
  sessionId: z.string(),
  direction: z.enum(["dropoff", "pickup", "both"]),
  seats: z.number().int().min(1).max(8),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional()
});

const requestSchema = z.object({
  sessionId: z.string(),
  direction: z.enum(["dropoff", "pickup", "both"]),
  seatsNeeded: z.number().int().min(1).max(8).default(1),
  notes: z.string().optional()
});

carpoolsRouter.get("/", async (req, res, next) => {
  try {
    const offers = await prisma.carpoolOffer.findMany({
      where: { session: { activity: { familyId: req.user!.familyId } } },
      include: { rides: { include: { child: true } }, session: { include: { activity: true } }, driver: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(offers.map((offer) => ({ ...offer, remainingSeats: remainingSeats(offer.seats, offer.rides) })));
  } catch (error) {
    next(error);
  }
});

carpoolsRouter.post("/offers", async (req, res, next) => {
  try {
    const input = offerSchema.parse(req.body);
    const offer = await prisma.carpoolOffer.create({ data: { ...input, driverId: req.user!.id } });
    res.status(201).json({ ...offer, remainingSeats: offer.seats });
  } catch (error) {
    next(error);
  }
});

carpoolsRouter.post("/requests", async (req, res, next) => {
  try {
    const input = requestSchema.parse(req.body);
    const request = await prisma.carpoolRequest.create({ data: { ...input, requesterId: req.user!.id } });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

carpoolsRouter.post("/offers/:offerId/rides", async (req, res, next) => {
  try {
    const input = z.object({ childId: z.string() }).parse(req.body);
    const ride = await prisma.carpoolRide.create({ data: { offerId: req.params.offerId, childId: input.childId } });
    res.status(201).json(ride);
  } catch (error) {
    next(error);
  }
});

carpoolsRouter.post("/rides/:rideId/approve", async (req, res, next) => {
  try {
    const ride = await prisma.carpoolRide.findUnique({
      where: { id: req.params.rideId },
      include: { offer: { include: { rides: true } } }
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    if (!canApproveRiders(ride.offer.seats, ride.offer.rides)) {
      return res.status(409).json({ error: "No seats available" });
    }
    const approved = await prisma.carpoolRide.update({ where: { id: ride.id }, data: { status: "approved" } });
    res.json(approved);
  } catch (error) {
    next(error);
  }
});
