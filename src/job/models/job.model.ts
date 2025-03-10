import { getModelForClass } from "@typegoose/typegoose";
import { JobPost, Application } from "./employer.job.schema";

export const JobPostModel = getModelForClass(JobPost, {
  schemaOptions: { timestamps: true },
});

export const ApplicationModel = getModelForClass(Application, {
  schemaOptions: { timestamps: true },
});
