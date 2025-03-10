import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsDate,
  IsPhoneNumber,
} from "class-validator";

export class ApplicantDto {
  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  linkedinId?: string;

  @IsString()
  name: string;

  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsOptional()
  @IsString()
  profile_pic?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  employment_history?: EmploymentHistoryDto[];
}

export class EmploymentHistoryDto {
  @IsString()
  job_title: string;

  @IsString()
  company_name: string;

  @IsString()
  employment_type: string;

  @IsDate()
  start_date: Date;

  @IsOptional()
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsString()
  description?: string;
}
