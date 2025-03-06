import rateLimit from "express-rate-limit";
import { Request } from "express";

const apiLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  headers: true,
  keyGenerator: (req: Request): string => {
    return req.ip || "unknown";
  },
});

export default apiLimiter;
