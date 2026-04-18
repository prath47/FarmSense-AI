import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../services/prisma";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "farmsense-secret-change-in-prod";

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get("/me", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const { userId } = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, createdAt: true } });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
