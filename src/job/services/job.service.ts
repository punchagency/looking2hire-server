import { Service } from "typedi";
import mongoose, { Error } from "mongoose";
import {
  ApplicationModel,
  JobPostModel,
  PopularJobsModel,
  SearchHistoryModel,
  SavedJobModel,
  ViewedJobModel,
} from "../models/job.model";
import { ApplicantModel, EmployerModel } from "../../auth/models/auth.model";
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
import generateJobDescription from "../../common/utils/jobDescription.util";

@Service()
export class JobService {
  async createJob(employerId: string, data: JobPostDto) {
    try {
      // Get employer details
      const employer = await EmployerModel.findById(employerId);
      if (!employer) {
        throw new Error("Employer not found");
      }

      // Generate job description using AI
      const jobDescription = await generateJobDescription(
        data.job_title,
        data.qualifications,
        employer.company_name
      );

      // Create job with generated description and company name
      return await JobPostModel.create({
        ...data,
        employerId,
        ...jobDescription,
      });
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

      // Get current job and employer details
      const currentJob = await JobPostModel.findOne({ _id: jobId, employerId });
      if (!currentJob) {
        throw new Error("Job not found");
      }

      const employer = await EmployerModel.findById(employerId);
      if (!employer) {
        throw new Error("Employer not found");
      }

      // Update job with new data
      return await JobPostModel.findOneAndUpdate(
        { _id: jobId, employerId },
        {
          ...data,
          company_name: employer.company_name, // Ensure company name is always included
        },
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

  async getAllJobs(employerId: string, page: number = 1) {
    try {
      const limit = 10; // Fixed limit of 10 items per page
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await JobPostModel.countDocuments({ employerId });

      // Get paginated jobs
      const jobs = await JobPostModel.find({ employerId })
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        jobs,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + jobs.length < total,
          hasPrevPage: page > 1,
        },
      };
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

      const job = await JobPostModel.findOne({
        _id: jobId,
        employerId,
      }).populate({
        path: "employerId",
        select:
          "company_name full_name email phone address company_logo heading body", // Add any other employer fields you need
      });
      if (!job) throw new Error("Job not found");

      // Get application statistics and applications with applicant details
      const [totalApplications, rejectedCount, hiredCount, applications] =
        await Promise.all([
          ApplicationModel.countDocuments({ jobId }),
          ApplicationModel.countDocuments({ jobId, status: "Rejected" }),
          ApplicationModel.countDocuments({ jobId, status: "Hired" }),
          ApplicationModel.find({ jobId })
            .populate("applicantId") // Get all applicant fields
            .lean(),
        ]);

      const jobObject = job.toObject();
      return {
        ...jobObject,
        employer: jobObject.employerId, // Rename employerId to employer for better clarity
        employerId: undefined, // Remove the original employerId field
        applicationStats: {
          total: totalApplications,
          rejected: rejectedCount,
          hired: hiredCount,
        },
        applications: applications.map((app) => ({
          ...app,
          applicant: app.applicantId, // Rename applicantId to applicant for better clarity
          applicantId: undefined, // Remove the original applicantId field
        })),
      };
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
      const popularJobs = await PopularJobsModel.find()
        .populate({
          path: "jobId",
          select:
            "job_title company_name job_address location qualifications description responsibilities requirements", // Add any other job fields you need
        })
        .sort({ applicationCount: -1 })
        .limit(10)
        .lean();

      // Transform the response to make it cleaner
      return popularJobs.map((job) => ({
        popularityStats: {
          _id: job._id,
          applicationCount: job.applicationCount,
          lastUpdated: job.lastUpdated,
        },
        jobDetails: job.jobId, // All the job details
      }));
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

  async saveJob(applicantId: string, data: SaveJobDto) {
    try {
      // Check if job exists
      const job = await JobPostModel.findById(data.jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      // Check if already saved
      const existingSave = await SavedJobModel.findOne({
        jobId: data.jobId,
        applicantId,
      });

      if (existingSave) {
        throw new Error("Job already saved");
      }

      return await SavedJobModel.create({
        jobId: data.jobId,
        applicantId,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save job: ${error.message}`);
      } else {
        throw new Error("Failed to save job: An unknown error occurred");
      }
    }
  }

  async unsaveJob(applicantId: string, jobId: string) {
    try {
      const result = await SavedJobModel.findOneAndDelete({
        jobId,
        applicantId,
      });
      if (!result) {
        throw new Error("Saved job not found");
      }
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to unsave job: ${error.message}`);
      } else {
        throw new Error("Failed to unsave job: An unknown error occurred");
      }
    }
  }

  async getSavedJobs(applicantId: string) {
    try {
      return await SavedJobModel.find({ applicantId })
        .populate("jobId")
        .sort({ savedAt: -1 })
        .lean();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get saved jobs: ${error.message}`);
      } else {
        throw new Error("Failed to get saved jobs: An unknown error occurred");
      }
    }
  }

  async markJobAsViewed(applicantId: string, data: ViewJobDto) {
    try {
      // Check if job exists
      const job = await JobPostModel.findById(data.jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      // Update or create view record
      return await ViewedJobModel.findOneAndUpdate(
        { jobId: data.jobId, applicantId },
        { $set: { viewedAt: new Date() } },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to mark job as viewed: ${error.message}`);
      } else {
        throw new Error(
          "Failed to mark job as viewed: An unknown error occurred"
        );
      }
    }
  }

  async getViewedJobs(applicantId: string) {
    try {
      return await ViewedJobModel.find({ applicantId })
        .populate("jobId")
        .sort({ viewedAt: -1 })
        .lean();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get viewed jobs: ${error.message}`);
      } else {
        throw new Error("Failed to get viewed jobs: An unknown error occurred");
      }
    }
  }

  async getRecommendedJobs(applicantId: string) {
    try {
      // Get applicant's heading
      const applicant = await ApplicantModel.findById(applicantId);
      if (!applicant) {
        throw new Error("Applicant not found");
      }

      if (!applicant.heading) {
        throw new Error("Applicant heading not found");
      }

      // Get all jobs and filter based on heading similarity
      const jobs = await JobPostModel.find().lean();

      // Convert heading to lowercase and split into words
      const heading = applicant.heading.toLowerCase();
      const headingWords = heading.split(" ").filter((word) => word.length > 3);

      // Filter jobs based on heading similarity
      const recommendedJobs = jobs.filter((job) => {
        // Convert job title to lowercase for case-insensitive comparison
        const jobTitle = job.job_title.toLowerCase();

        // Check if job title contains any words from the heading
        return headingWords.some((word) => jobTitle.includes(word));
      });

      // Sort by relevance (number of matching words)
      recommendedJobs.sort((a, b) => {
        const aMatches = headingWords.filter((word) =>
          a.job_title.toLowerCase().includes(word)
        ).length;
        const bMatches = headingWords.filter((word) =>
          b.job_title.toLowerCase().includes(word)
        ).length;
        return bMatches - aMatches;
      });

      // Limit to 10 recommendations
      return recommendedJobs.slice(0, 10);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get recommended jobs: ${error.message}`);
      } else {
        throw new Error(
          "Failed to get recommended jobs: An unknown error occurred"
        );
      }
    }
  }
}
