import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type AuthPayload = {
  sub: string;
  email: string;
};

export type AuthedRequest = Request & {
  user?: AuthPayload;
};

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing authentication token" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
