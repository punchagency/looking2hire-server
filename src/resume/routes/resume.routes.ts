import express from "express";
import multer from "multer";
import { authenticate } from "../../common/middlewares/auth.middleware";
import Container from "typedi";
import { ResumeController } from "../controllers/resume.controller";

const resumeRouter = express.Router();
const upload = multer({ dest: "uploads/" });
const resumeController = Container.get(ResumeController);

resumeRouter.post(
  "/upload",
  authenticate,
  upload.single("resume"),
  resumeController.uploadResume.bind(resumeController)
);

export default resumeRouter;
