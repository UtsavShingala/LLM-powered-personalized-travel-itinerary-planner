import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET as string, {
    expiresIn: "7d"
  });

  return res.status(201).json({
    token,
    user: { id: user._id.toString(), name: user.name, email: user.email }
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });

  const user = await User.findOne({ email: parsed.data.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_SECRET as string, {
    expiresIn: "7d"
  });

  return res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email } });
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.user?.sub).select("name email");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ id: user._id.toString(), name: user.name, email: user.email });
});

export default router;
