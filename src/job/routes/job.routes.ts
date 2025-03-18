import express from "express";
import { Container } from "typedi";
import { authenticate } from "../../common/middlewares/auth.middleware";
import { JobController } from "../controllers/job.controller";

const jobRouter = express.Router();
const jobController = Container.get(JobController);

jobRouter.post(
  "/employer/create",
  authenticate,
  jobController.createJob.bind(jobController)
);
jobRouter.get(
  "/employer/get/all",
  authenticate,
  jobController.getAllJobs.bind(jobController)
);
jobRouter.get(
  "/employer/get/:jobId",
  authenticate,
  jobController.getJobById.bind(jobController)
);
jobRouter.patch(
  "/employer/update/:jobId",
  authenticate,
  jobController.updateJob.bind(jobController)
);
jobRouter.delete(
  "/employer/delete/:jobId",
  authenticate,
  jobController.deleteJob.bind(jobController)
);
jobRouter.post(
  "/applicant/employment-history",
  authenticate,
  jobController.addEmploymentHistory.bind(jobController)
);
jobRouter.patch(
  "/applicant/employment-history/:employmentId",
  authenticate,
  jobController.updateEmploymentHistory.bind(jobController)
);
jobRouter.delete(
  "/applicant/employment-history/:employmentId",
  authenticate,
  jobController.deleteEmploymentHistory.bind(jobController)
);

jobRouter.post(
  "/applicant/map/distance",
  authenticate,
  jobController.getJobsByDistance.bind(jobController)
);
jobRouter.get(
  "/applicant/search",
  authenticate,
  jobController.searchJobs.bind(jobController)
);
jobRouter.get(
  "/applicant/search/history",
  authenticate,
  jobController.getRecentSearches.bind(jobController)
);
jobRouter.get(
  "/applicant/popular",
  authenticate,
  jobController.getPopularJobs.bind(jobController)
);
jobRouter.post(
  "/applicant/apply",
  authenticate,
  jobController.applyToJob.bind(jobController)
);
jobRouter.get(
  "/applicant/recent",
  authenticate,
  jobController.getRecentJobs.bind(jobController)
);

// Save and View Job Routes
jobRouter.post(
  "/applicant/save",
  authenticate,
  jobController.saveJob.bind(jobController)
);

jobRouter.delete(
  "/applicant/save/:jobId",
  authenticate,
  jobController.unsaveJob.bind(jobController)
);

jobRouter.get(
  "/applicant/saved",
  authenticate,
  jobController.getSavedJobs.bind(jobController)
);

jobRouter.post(
  "/applicant/view",
  authenticate,
  jobController.markJobAsViewed.bind(jobController)
);

jobRouter.get(
  "/applicant/viewed",
  authenticate,
  jobController.getViewedJobs.bind(jobController)
);

jobRouter.get(
  "/applicant/recommended",
  authenticate,
  jobController.getRecommendedJobs.bind(jobController)
);

export default jobRouter;
