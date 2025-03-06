import "reflect-metadata";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/mongodb-config";
import { env } from "./config/env";
import authRouter from "./auth/routes/auth.routes";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import "./config/passport/google.strategy";
import "./config/passport/linkedin.strategy";
import passport from "passport";

// Initialize Passport Middleware

dotenv.config();

const app = express();
app.use(passport.initialize());
app.use(cookieParser());
app.use(
  cors()
  // { origin: "http://localhost:3000", credentials: true }
);
app.use(express.json());

connectDB();

app.use("/api/auth", authRouter);

const PORT = env.server_port || 8080;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
