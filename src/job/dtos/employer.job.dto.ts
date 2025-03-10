import { IsArray, IsString } from "class-validator";
import { IsOptional } from "class-validator";
import { IsDate } from "class-validator";
import { IsEnum } from "class-validator";

export class JobPostDto {
  @IsString()
  job_title: string;

  @IsString()
  job_address: string;

  @IsArray()
  qualifications: string[];
}

export class UpdateJobPostDto {
  constructor(init?: Partial<JobPostDto>) {
    Object.assign(this, init);
  }
}

export class ApplicationDto {
  @IsString()
  job_id: string; // ObjectId reference

  @IsString()
  applicant_id: string; // ObjectId reference

  @IsOptional()
  @IsDate()
  applied_at?: Date;

  @IsEnum(["Pending", "Reviewed", "Interview", "Hired", "Rejected"])
  status: string;
}
