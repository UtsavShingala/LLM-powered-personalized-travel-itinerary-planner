import { Router } from "express";
import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { generateTripPlan } from "../services/llm.js";

const router = Router();

const createTripSchema = z.object({
  destination: z.string().min(2),
  days: z.number().int().min(1).max(21),
  budgetType: z.enum(["Low", "Medium", "High"]),
  interests: z.array(z.string().min(2)).min(1)
});

router.use(authMiddleware);

router.post("/", async (req: AuthedRequest, res) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const plan = await generateTripPlan(parsed.data);
  const trip = await Trip.create({ userId: req.user?.sub, ...parsed.data, ...plan });

  return res.status(201).json(trip);
});

router.get("/", async (req: AuthedRequest, res) => {
  const trips = await Trip.find({ userId: req.user?.sub }).sort({ createdAt: -1 });
  return res.json(trips);
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user?.sub });
  if (!trip) return res.status(404).json({ message: "Trip not found" });
  return res.json(trip);
});

router.post("/:id/activities", async (req: AuthedRequest, res) => {
  const schema = z.object({ day: z.number().int().min(1), activity: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user?.sub });
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const dayEntry = trip.itinerary.find((d: { day: number }) => d.day === parsed.data.day);
  if (!dayEntry) return res.status(404).json({ message: "Day not found" });

  dayEntry.activities.push(parsed.data.activity);
  await trip.save();
  return res.json(trip);
});

router.delete("/:id/activities", async (req: AuthedRequest, res) => {
  const schema = z.object({ day: z.number().int().min(1), activity: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user?.sub });
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const dayEntry = trip.itinerary.find((d: { day: number }) => d.day === parsed.data.day);
  if (!dayEntry) return res.status(404).json({ message: "Day not found" });

  dayEntry.activities = dayEntry.activities.filter((item: string) => item !== parsed.data.activity);
  await trip.save();
  return res.json(trip);
});

router.post("/:id/regenerate-day", async (req: AuthedRequest, res) => {
  const schema = z.object({ day: z.number().int().min(1), instruction: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user?.sub });
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  const dayEntry = trip.itinerary.find((d: { day: number }) => d.day === parsed.data.day);
  if (!dayEntry) return res.status(404).json({ message: "Day not found" });

  dayEntry.activities = [
    `${parsed.data.instruction} - Morning activity in ${trip.destination}`,
    `${parsed.data.instruction} - Afternoon activity in ${trip.destination}`,
    `${parsed.data.instruction} - Evening activity in ${trip.destination}`
  ];

  await trip.save();
  return res.json(trip);
});

export default router;
