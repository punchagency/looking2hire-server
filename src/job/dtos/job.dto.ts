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

  @IsString()
  job_description: string;

  @IsArray()
  location: [number, number];

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
