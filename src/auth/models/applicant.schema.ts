import { index, prop, Ref } from "@typegoose/typegoose";

export class EmploymentHistory {
  @prop({ required: true })
  job_title: string;

  @prop({ required: true })
  company_name: string;

  @prop({ required: true })
  employment_type: string;

  @prop({ required: true })
  start_date: Date;

  @prop({ required: false })
  end_date?: Date;

  @prop({ required: false })
  description?: string;
}

export class Applicant {
  @prop({ unique: true, sparse: true })
  googleId?: string;

  @prop({ unique: true, sparse: true })
  linkedinId?: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ required: false })
  profile_pic?: string;

  @prop({ required: false })
  heading?: string;

  @prop({ required: false })
  description?: string;

  @prop({ type: () => [EmploymentHistory], required: false })
  employment_history?: EmploymentHistory[];
}

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export class AuthCode {
  @prop({ required: true, unique: true })
  code: string;

  @prop({ required: true, ref: () => Applicant })
  applicant_id: Ref<Applicant>;

  @prop({ default: () => new Date(Date.now() + 5 * 60 * 1000) }) // 5 min expiration
  expiresAt: Date;
}
