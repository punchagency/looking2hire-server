// job.controller.ts
import { Response, NextFunction } from "express";
import { Service } from "typedi";
import { JobService } from "../services/job.service";
import { JobPostDto, UpdateJobPostDto } from "../dtos/employer.job.dto";
import { validateOrReject } from "class-validator";
import { ApiError } from "../../common/middlewares/error.middleware";
import { AuthRequest } from "../../common/middlewares/auth.middleware";

@Service()
export class JobController {
  constructor(private readonly jobService: JobService) {}

  async createJob(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new JobPostDto(), req.body);
      await validateOrReject(data);
      const job = await this.jobService.createJob(req.user.id, data);
      res.status(201).json({ success: true, job });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async updateJob(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const data = Object.assign(new UpdateJobPostDto(), req.body);
      await validateOrReject(data);
      const job = await this.jobService.updateJob(req.user.id, jobId, data);
      res.status(200).json({ success: true, job });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getAllJobs(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const jobs = await this.jobService.getAllJobs(req.user.id);
      res.status(200).json({ success: true, jobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async getJobById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await this.jobService.getJobById(req.user.id, jobId);
      res.status(200).json({ success: true, job });
    } catch (error: any) {
      next(new ApiError(error, 404));
    }
  }

  async deleteJob(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      await this.jobService.deleteJob(req.user.id, jobId);
      res
        .status(200)
        .json({ success: true, message: "Job deleted successfully" });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }
}
