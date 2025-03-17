import { Ref } from "@typegoose/typegoose";
import { prop, index } from "@typegoose/typegoose";
import { Applicant, Employer } from "../../auth/models/auth.schema";

export class SearchHistory {
  @prop({ required: true, ref: () => Applicant })
  applicantId: Ref<Applicant>;

  @prop({ required: true })
  query: string;

  @prop({ default: Date.now })
  createdAt?: Date;
}

@index({ applicationCount: -1 })
export class PopularJobs {
  @prop({ required: true, ref: () => JobPost })
  jobId: Ref<JobPost>;

  @prop({ default: 0 })
  applicationCount: number;

  @prop({ default: Date.now })
  lastUpdated?: Date;
}

@index({ location: "2dsphere" })
export class JobPost {
  @prop({ required: true, ref: () => Employer })
  employerId: Ref<Employer>;

  @prop({ required: true })
  job_title: string;

  @prop({ required: true })
  job_address: string;

  @prop({ type: () => [Number], required: true })
  location: [number, number];

  @prop({ required: true })
  job_description: string;

  @prop({ required: true, type: () => [String] })
  qualifications: string[];
}

export class Application {
  @prop({ required: true, ref: () => JobPost })
  jobId: Ref<JobPost>;

  @prop({ required: true, ref: () => Applicant })
  applicantId: Ref<Applicant>;

  @prop({
    required: true,
    enum: ["Pending", "Reviewed", "Interview", "Hired", "Rejected"],
  })
  status: string;
}
