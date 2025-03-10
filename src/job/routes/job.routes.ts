import express from "express";
import { Container } from "typedi";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { JobController } from "../controllers/job.controller";

const jobRouter = express.Router();
const jobController = Container.get(JobController);

jobRouter.post("/", authenticate, jobController.createJob.bind(jobController));
jobRouter.get("/", authenticate, jobController.getAllJobs.bind(jobController));
jobRouter.get(
  "/:jobId",
  authenticate,
  jobController.getJobById.bind(jobController)
);
jobRouter.patch(
  "/:jobId",
  authenticate,
  jobController.updateJob.bind(jobController)
);
jobRouter.delete(
  "/:jobId",
  authenticate,
  jobController.deleteJob.bind(jobController)
);

export default jobRouter;
