import { getModelForClass } from "@typegoose/typegoose";
import { Employer, OTP } from "./auth.schema";
import { Applicant } from "./auth.schema";
import { AuthCode } from "./auth.schema";

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
