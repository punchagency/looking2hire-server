import { getModelForClass } from "@typegoose/typegoose";
import {
  JobPost,
  Application,
  SearchHistory,
  PopularJobs,
  SavedJob,
  ViewedJob,
} from "./job.schema";

export const JobPostModel = getModelForClass(JobPost, {
  schemaOptions: { timestamps: true },
});

export const ApplicationModel = getModelForClass(Application, {
  schemaOptions: { timestamps: true },
});

export const SearchHistoryModel = getModelForClass(SearchHistory, {
  schemaOptions: { timestamps: true },
});

export const PopularJobsModel = getModelForClass(PopularJobs, {
  schemaOptions: { timestamps: true },
});

export const SavedJobModel = getModelForClass(SavedJob, {
  schemaOptions: { timestamps: true },
});

export const ViewedJobModel = getModelForClass(ViewedJob, {
  schemaOptions: { timestamps: true },
});
