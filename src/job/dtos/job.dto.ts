import { IsNumber } from "class-validator";
import { IsString } from "class-validator";
import { IsArray } from "class-validator";
import { IsOptional } from "class-validator";
import { IsDate } from "class-validator";
import { IsEnum } from "class-validator";

export class JobPostDto {
  @IsString()
  job_title: string;

  @IsString()
  job_address: string;

  @IsArray()
  location: [number, number];

  @IsString()
  qualifications: string;

  //
  @IsNumber()
  salary_min: number;

  @IsNumber()
  salary_max: number;

  @IsString()
  salary_currency: string; // e.g., "USD"

  @IsString()
  @IsEnum(["Hourly", "Weekly", "Monthly", "Annually"], {
    message: "Invalid salary period",
  })
  salary_period: string;

  @IsString()
  @IsEnum(["Remote", "Hybrid", "Onsite"], { message: "Invalid work type" })
  work_type: string;

  @IsString()
  @IsEnum(["Full Time", "Part Time", "Contract"], {
    message: "Invalid employment type",
  })
  employment_type: string;

  @IsString()
  @IsEnum(["Junior", "Mid", "Senior"], { message: "Invalid seniority" })
  seniority: string;
}

export class UpdateJobPostDto {
  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  job_address?: string;

  @IsOptional()
  @IsArray()
  location?: [number, number];

  @IsOptional()
  @IsString()
  qualifications?: string;

  //
  @IsOptional()
  @IsNumber()
  salary_min?: number;

  @IsOptional()
  @IsNumber()
  salary_max?: number;

  @IsOptional()
  @IsString()
  salary_currency?: string;

  @IsOptional()
  @IsString()
  @IsEnum(["Hourly", "Weekly", "Monthly", "Annually"], {
    message: "Invalid salary period",
  })
  salary_period?: string;

  @IsOptional()
  @IsString()
  @IsEnum(["Remote", "Hybrid", "Onsite"], { message: "Invalid work type" })
  work_type?: string;

  @IsOptional()
  @IsString()
  @IsEnum(["Full Time", "Part Time", "Contract"], {
    message: "Invalid employment type",
  })
  employment_type?: string;

  @IsOptional()
  @IsString()
  @IsEnum(["Junior", "Mid", "Senior"], { message: "Invalid seniority" })
  seniority?: string;
}

export class ApplicationDto {
  @IsString()
  jobId: string;
}

export class SearchDto {
  @IsString()
  title: string;
}

export class DistanceFilterDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  maxDistance: number;
}

export class ApplyJobDto {
  @IsString()
  jobId: string;
}

export class SaveJobDto {
  @IsString()
  jobId: string;
}

export class ViewJobDto {
  @IsString()
  jobId: string;
}
