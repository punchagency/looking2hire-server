import { getModelForClass } from "@typegoose/typegoose";
// import { AuthCode, User } from "./auth.schema";
import { Employer, OTP } from "./employer.schema";
import { Applicant, AuthCode } from "./applicant.schema";

export const AuthCodeModel = getModelForClass(AuthCode, {
  schemaOptions: { timestamps: true },
});

export const ApplicantModel = getModelForClass(Applicant, {
  schemaOptions: { timestamps: true },
});

export const EmployerModel = getModelForClass(Employer, {
  schemaOptions: { timestamps: true },
});

export const OTPModel = getModelForClass(OTP, {
  schemaOptions: { timestamps: true },
});
