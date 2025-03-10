import { Service } from "typedi";
import mongoose, { Error } from "mongoose";
import { JobPostModel } from "../models/job.model";
import { JobPostDto } from "../dtos/employer.job.dto";

@Service()
export class JobService {
  async createJob(employerId: string, data: JobPostDto) {
    try {
      return await JobPostModel.create({ ...data, employerId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Job creation failed: ${error.message}`);
      } else {
        throw new Error("Job creation failed: An unknown error occurred");
      }
    }
  }

  async updateJob(employerId: string, jobId: string, data: JobPostDto) {
    try {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new Error("Invalid mongodb ID");
      }

      return await JobPostModel.findOneAndUpdate(
        { _id: jobId, employerId },
        data,
        { new: true, runValidators: true }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Job update failed: ${error.message}`);
      } else {
        throw new Error("Job update failed: An unknown error occurred");
      }
    }
  }

  async getAllJobs(employerId: string) {
    try {
      return await JobPostModel.find({ employerId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching jobs failed: ${error.message}`);
      } else {
        throw new Error("Fetching jobs failed: An unknown error occurred");
      }
    }
  }

  async getJobById(employerId: string, jobId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new Error("Invalid mongodb ID");
      }

      const job = await JobPostModel.findOne({ _id: jobId, employerId });
      if (!job) throw new Error("Job not found");
      return job;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching job failed: ${error.message}`);
      } else {
        throw new Error("Fetching job failed: An unknown error occurred");
      }
    }
  }

  async deleteJob(employerId: string, jobId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new Error("Invalid mongodb ID");
      }

      return await JobPostModel.findOneAndDelete({ _id: jobId, employerId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Job deletion failed: ${error.message}`);
      } else {
        throw new Error("Job deletion failed: An unknown error occurred");
      }
    }
  }
}
