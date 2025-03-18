import { index, pre, prop, Ref } from "@typegoose/typegoose";
import bcrypt from "bcryptjs";

export class EmploymentHistory {
  @prop({ required: true })
  job_title: string;

  @prop({ required: false })
  company_logo?: string;

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

@pre<Applicant>("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
})
export class Applicant {
  @prop({ unique: true, sparse: true })
  googleId?: string;

  @prop({ unique: true, sparse: true })
  linkedinId?: string;

  @prop({ required: false })
  name?: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ required: false })
  password?: string;

  @prop({ required: false })
  profile_pic?: string;

  @prop({ required: false })
  heading?: string;

  @prop({ required: false })
  description?: string;

  @prop({ type: () => [EmploymentHistory], required: false })
  employment_history?: EmploymentHistory[];

  @prop({ default: false })
  isVerified: boolean;

  comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password ?? "");
  }
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

@pre<Employer>("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
})
export class Employer {
  @prop({ required: true })
  company_name: string;

  @prop({ required: true })
  password: string;

  @prop({ required: false })
  company_logo?: string;

  @prop({ required: true })
  address: string;

  @prop({ type: () => [Number], required: true })
  location: [number, number];

  @prop({ required: false })
  heading?: string;

  @prop({ required: false })
  body?: string;

  @prop({ required: true })
  full_name: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ required: true })
  phone: string;

  @prop({ default: false })
  isVerified: boolean;

  comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password ?? "");
  }
}

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ email: 1 }, { unique: true, sparse: true })
export class OTP {
  @prop({ required: true })
  email: string;

  @prop({ required: true })
  otpCode: string;

  @prop({ default: () => new Date(Date.now() + 5 * 60 * 1000) }) // OTP expires in 5 minutes
  expiresAt: Date;
}
