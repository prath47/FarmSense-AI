import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "farmsense-secret-change-in-prod";

export interface AuthRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { userId } = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    (req as AuthRequest).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
