import { Service } from "typedi";
import mongoose, { Error } from "mongoose";
import {
  ApplicationModel,
  JobPostModel,
  PopularJobsModel,
  SearchHistoryModel,
} from "../models/job.model";
import { ApplicantModel } from "../../auth/models/auth.model";
import {
  JobPostDto,
  UpdateJobPostDto,
  DistanceFilterDto,
  ApplyJobDto,
  SearchDto,
} from "../dtos/job.dto";
import {
  EmploymentHistoryDto,
  UpdateEmploymentHistoryDto,
} from "../../auth/dtos/auth.dto";

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

  async updateJob(employerId: string, jobId: string, data: UpdateJobPostDto) {
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

  async addEmploymentHistory(applicantId: string, data: EmploymentHistoryDto) {
    try {
      const updatedApplicant = await ApplicantModel.findByIdAndUpdate(
        applicantId,
        { $push: { employment_history: data } },
        { new: true, runValidators: true }
      );
      if (!updatedApplicant) throw new Error("Applicant not found.");
      return updatedApplicant;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Adding employment history failed: ${error.message}`);
      } else {
        throw new Error(
          "Adding employment history failed: An unknown error occurred"
        );
      }
    }
  }

  async updateEmploymentHistory(
    applicantId: string,
    employmentId: string,
    data: UpdateEmploymentHistoryDto
  ) {
    try {
      if (!mongoose.Types.ObjectId.isValid(employmentId)) {
        throw new Error("Invalid mongodb ID");
      }

      console.log("ran");
      const updatedApplicant = await ApplicantModel.findOneAndUpdate(
        { _id: applicantId, "employment_history._id": employmentId },
        {
          $set: Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              `employment_history.$.${key}`,
              value,
            ])
          ),
        },
        { new: true, runValidators: true }
      );
      if (!updatedApplicant) throw new Error("Employment history not found.");
      return updatedApplicant;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Updating employment history failed: ${error.message}`);
      } else {
        throw new Error(
          "Updating employment history failed: An unknown error occurred"
        );
      }
    }
  }

  async deleteEmploymentHistory(applicantId: string, employmentId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(employmentId)) {
        throw new Error("Invalid employment ID");
      }

      // First, check if the employment history exists
      const applicant = await ApplicantModel.findOne({
        _id: applicantId,
        "employment_history._id": employmentId, // Ensure the employment ID exists
      });

      if (!applicant) {
        throw new Error("Employment history not found.");
      }

      // Now, proceed with deletion
      const updatedApplicant = await ApplicantModel.findByIdAndUpdate(
        applicantId,
        { $pull: { employment_history: { _id: employmentId } } },
        { new: true }
      );

      return updatedApplicant;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Deleting employment history failed: ${error.message}`);
      } else {
        throw new Error(
          "Deleting employment history failed: An unknown error occurred"
        );
      }
    }
  }

  async getJobsByDistance(data: DistanceFilterDto) {
    try {
      return await JobPostModel.find({
        location: {
          $geoWithin: {
            $centerSphere: [
              [data.longitude, data.latitude],
              data.maxDistance / 6378137,
            ],
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching jobs by distance failed: ${error.message}`);
      } else {
        throw new Error(
          "Fetching jobs by distance failed: An unknown error occurred"
        );
      }
    }
  }

  async addSearchHistory(applicantId: string, query: string) {
    try {
      await SearchHistoryModel.findOneAndUpdate(
        { applicantId, query }, // Use "applicantId" instead of "applicant"
        { $set: { createdAt: new Date() } },
        { upsert: true, new: true } // Ensure the updated document is returned
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update search history: ${error.message}`);
      } else {
        throw new Error(
          "Failed to update search history: An unknown error occurred"
        );
      }
    }
  }

  async searchJobs(applicantId: string, data: SearchDto) {
    try {
      const jobs = await JobPostModel.find({
        job_title: { $regex: data.title, $options: "i" },
      }).lean();
      console.log({ jobs });
      await this.addSearchHistory(applicantId, data.title);
      return jobs;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Job search failed: ${error.message}`);
      } else {
        throw new Error("Job search failed: An unknown error occurred");
      }
    }
  }

  async getRecentSearches(applicantId: string) {
    try {
      const recentSearches = await SearchHistoryModel.find({
        applicantId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return recentSearches;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching recent searches failed: ${error.message}`);
      } else {
        throw new Error(
          "Fetching recent searches failed: An unknown error occurred"
        );
      }
    }
  }

  async getPopularJobs() {
    try {
      return await PopularJobsModel.find()
        .sort({ applicationCount: -1 })
        .limit(10)
        .lean();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching popular jobs failed: ${error.message}`);
      } else {
        throw new Error(
          "Fetching popular jobs failed: An unknown error occurred"
        );
      }
    }
  }

  async applyToJob(applicantId: string, data: ApplyJobDto) {
    try {
      // Check if the job exists before applying
      const job = await JobPostModel.findById(data.jobId);
      if (!job) {
        throw new Error("Job not found. It may have been removed.");
      }

      // Check if the applicant has already applied
      const existingApplication = await ApplicationModel.findOne({
        jobId: data.jobId,
        applicantId,
      });

      if (existingApplication) {
        throw new Error("You have already applied for this job.");
      }

      // Create the application
      const application = await ApplicationModel.create({
        jobId: data.jobId,
        applicantId,
        status: "Pending",
      });

      // Update popular jobs data
      await PopularJobsModel.findOneAndUpdate(
        { jobId: data.jobId },
        { $inc: { applicationCount: 1 }, $set: { lastUpdated: new Date() } },
        { upsert: true }
      );

      return application;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Applying to job failed: ${error.message}`);
      } else {
        throw new Error("Applying to job failed due to an unknown error.");
      }
    }
  }

  async getRecentJobs() {
    try {
      return await JobPostModel.find().sort({ createdAt: -1 }).limit(10);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Fetching recent jobs failed: ${error.message}`);
      } else {
        throw new Error(
          "Fetching recent jobs failed: An unknown error occurred"
        );
      }
    }
  }
}
