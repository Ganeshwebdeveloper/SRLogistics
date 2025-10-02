import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import "./types";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function requireRole(role: "admin" | "driver") {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== role) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }

  next();
}
