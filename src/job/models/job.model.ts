import { getModelForClass } from "@typegoose/typegoose";
import { Application, JobPost, PopularJobs, SearchHistory } from "./job.schema";

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
