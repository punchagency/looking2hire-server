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
import { errorMiddleware } from "./common/middlewares/error.middleware";
import jobRouter from "./job/routes/job.routes";
import decalRouter from "./decal/routes/decal.routes";
import resumeRouter from "./resume/routes/resume.routes";

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
app.use("/api/job", jobRouter);
app.use("/api/decal", decalRouter);
app.use("/api/resume", resumeRouter);
app.use(errorMiddleware);

const PORT = process.env.PORT || env.server_port; // Use Heroku's port or fallback to env config

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
