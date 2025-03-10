import { index, prop, Ref, pre } from "@typegoose/typegoose";
import { Applicant } from "./applicant.auth.schema";
import bcrypt from "bcryptjs";

@pre<Employer>("save", async function (next) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
})
export class Employer {
  @prop({ required: true })
  company_name: string;

  @prop({ required: false }) // Removed required constraint
  password?: string; // Password is now optional

  @prop({ required: false })
  company_logo?: string;

  @prop({ required: false })
  address?: string;

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
