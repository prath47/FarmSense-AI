import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import prisma from "../services/prisma";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const all = await prisma.transaction.findMany({ where: { userId } });

  const totalRevenue = all.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = all.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const returnOnInvestment = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  const byCategory: Record<string, number> = {};
  for (const t of all) {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  }

  res.json({ totalRevenue, totalExpenses, netProfit, returnOnInvestment, byCategory });
});

router.get("/transactions", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const { season } = req.query as { season?: string };
  const where = season ? { userId, season } : { userId };
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
  res.json(transactions);
});

router.post("/transactions", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const { type, category, amount, description, date, season } = req.body;
  const tx = await prisma.transaction.create({
    data: { userId, type, category, amount: parseFloat(amount), description, date: new Date(date), season: season || null },
  });
  res.status(201).json(tx);
});

router.put("/transactions/:id", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const tx = await prisma.transaction.findFirst({ where: { id: req.params.id, userId } });
  if (!tx) { res.status(404).json({ error: "Not found" }); return; }
  const { type, category, amount, description, date, season } = req.body;
  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      ...(type && { type }),
      ...(category && { category }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(description && { description }),
      ...(date && { date: new Date(date) }),
      ...(season !== undefined && { season: season || null }),
    },
  });
  res.json(updated);
});

router.delete("/transactions/:id", async (req, res: Response) => {
  const userId = (req as unknown as AuthRequest).userId;
  const tx = await prisma.transaction.findFirst({ where: { id: req.params.id, userId } });
  if (!tx) { res.status(404).json({ error: "Not found" }); return; }
  await prisma.transaction.delete({ where: { id: tx.id } });
  res.json({ deleted: true });
});

export default router;
