import { Ref } from "@typegoose/typegoose";
import { prop } from "@typegoose/typegoose";
import { Applicant } from "../../auth/models/applicant.auth.schema";
import { Employer } from "../../auth/models/employer.auth.schema";

export class JobPost {
  @prop({ required: true, ref: () => Employer })
  employerId: Ref<Employer>;

  @prop({ required: true })
  job_title: string;

  @prop({ required: true })
  job_address: string;

  @prop({ required: true, type: () => [String] })
  qualifications: string[];
}

export class Application {
  @prop({ required: true, ref: () => JobPost })
  job_id: Ref<JobPost>;

  @prop({ required: true, ref: () => Applicant })
  applicant_id: Ref<Applicant>;

  @prop({ default: Date.now })
  applied_at?: Date;

  @prop({
    required: true,
    enum: ["Pending", "Reviewed", "Interview", "Hired", "Rejected"],
  })
  status: string;
}
