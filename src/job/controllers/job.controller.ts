// job.controller.ts
import { Response, NextFunction } from "express";
import { Service } from "typedi";
import { JobService } from "../services/job.service";
import { validateOrReject } from "class-validator";
import { ApiError } from "../../common/middlewares/error.middleware";
import { AuthRequest } from "../../common/middlewares/auth.middleware";
import {
  JobPostDto,
  UpdateJobPostDto,
  DistanceFilterDto,
  ApplyJobDto,
  SearchDto,
  SaveJobDto,
  ViewJobDto,
} from "../dtos/job.dto";
import {
  EmploymentHistoryDto,
  UpdateEmploymentHistoryDto,
} from "../../auth/dtos/auth.dto";

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

  async addEmploymentHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new EmploymentHistoryDto(), req.body);
      await validateOrReject(data);
      const updatedApplicant = await this.jobService.addEmploymentHistory(
        req.user.id,
        data
      );
      res.status(201).json({
        success: true,
        data: updatedApplicant,
      });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async updateEmploymentHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { employmentId } = req.params;
      const data = Object.assign(new UpdateEmploymentHistoryDto(), req.body);
      await validateOrReject(data);
      const updatedApplicant = await this.jobService.updateEmploymentHistory(
        req.user.id,
        employmentId,
        data
      );
      res.status(200).json({
        success: true,
        data: updatedApplicant,
      });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async deleteEmploymentHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { employmentId } = req.params;
      await this.jobService.deleteEmploymentHistory(req.user.id, employmentId);
      res.status(200).json({
        success: true,
        message: "Employment history deleted successfully.",
      });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getJobsByDistance(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new DistanceFilterDto(), req.body);
      await validateOrReject(data);
      const jobs = await this.jobService.getJobsByDistance(data);
      res.json({ success: true, jobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async searchJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let data = { title: req.query.title as string };
      data = Object.assign(new SearchDto(), data);
      console.log("data", data);
      await validateOrReject(data);
      const jobs = await this.jobService.searchJobs(req.user.id, data);
      res.json({ success: true, jobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async getRecentSearches(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const searches = await this.jobService.getRecentSearches(req.user.id);
      res.json({ success: true, searches });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async getPopularJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const jobs = await this.jobService.getPopularJobs();
      res.json({ success: true, jobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async applyToJob(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new ApplyJobDto(), req.body);
      await validateOrReject(data);
      const application = await this.jobService.applyToJob(req.user.id, data);
      res.status(201).json({ success: true, application });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getRecentJobs(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const jobs = await this.jobService.getRecentJobs();
      res.status(200).json({ success: true, jobs });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async saveJob(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = Object.assign(new SaveJobDto(), req.body);
      await validateOrReject(data);
      const savedJob = await this.jobService.saveJob(req.user.id, data);
      res.status(201).json({ success: true, savedJob });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async unsaveJob(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      await this.jobService.unsaveJob(req.user.id, jobId);
      res
        .status(200)
        .json({ success: true, message: "Job unsaved successfully" });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getSavedJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const savedJobs = await this.jobService.getSavedJobs(req.user.id);
      res.status(200).json({ success: true, savedJobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async markJobAsViewed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = Object.assign(new ViewJobDto(), req.body);
      await validateOrReject(data);
      const viewedJob = await this.jobService.markJobAsViewed(
        req.user.id,
        data
      );
      res.status(200).json({ success: true, viewedJob });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getViewedJobs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const viewedJobs = await this.jobService.getViewedJobs(req.user.id);
      res.status(200).json({ success: true, viewedJobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }

  async getRecommendedJobs(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const recommendedJobs = await this.jobService.getRecommendedJobs(
        req.user.id
      );
      res.status(200).json({ success: true, recommendedJobs });
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }
}
