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
