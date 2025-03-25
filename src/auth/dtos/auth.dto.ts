import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsDate,
  IsPhoneNumber,
  IsNotEmpty,
  IsEnum,
  ValidateIf,
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

  //   @IsOptional()
  //   @IsString()
  //   profile_pic?: string;

  //   @IsOptional()
  //   @IsString()
  //   heading?: string;

  //   @IsOptional()
  //   @IsString()
  //   description?: string;

  //   @IsOptional()
  //   @IsArray()
  //   employment_history?: EmploymentHistoryDto[];
}

export class EmploymentHistoryDto {
  @IsString()
  job_title: string;

  @IsOptional()
  @IsString()
  company_logo?: string;

  @IsString()
  company_name: string;

  @IsString()
  employment_type: string;

  @IsString()
  start_date: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateEmploymentHistoryDto {
  constructor(init?: Partial<EmploymentHistoryDto>) {
    Object.assign(this, init);
  }
}

export class SendOTPDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsNotEmpty({ message: "Context is required" })
  @IsString()
  @IsEnum(["forgot-password", "signup"], {
    message: "Invalid context option",
  })
  context: string;

  @IsNotEmpty({ message: "User type is required" })
  @IsString()
  @IsEnum(["employer", "applicant"], {
    message: "Invalid user type option",
  })
  userType: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsNotEmpty({ message: "OTP code is required" })
  otpCode: string;

  @IsNotEmpty({ message: "Context is required" })
  @IsString()
  @IsEnum(["forgot-password", "signup"], {
    message: "Invalid context option",
  })
  context: string;

  @IsNotEmpty({ message: "User type is required" })
  @IsString()
  @IsEnum(["employer", "applicant"], {
    message: "Invalid user type option",
  })
  userType: string;
}

export class EmployerSignupDto {
  @IsString()
  company_name: string;

  @IsString()
  full_name: string;

  @IsString()
  address: string;

  @IsArray()
  location: [number, number];

  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsPhoneNumber(undefined, { message: "Invalid phone number format" })
  phone: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class ApplicantSignupDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class EmployerSigninDto {
  @ValidateIf((o) => !o.phone) // Validate email if phoneNumber is missing
  @IsEmail({}, { message: "Invalid email format" })
  @IsOptional()
  email?: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber(undefined, { message: "Invalid phone number format" })
  @IsOptional()
  phone?: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class ApplicantSigninDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  password: string;
}

export class UpdateEmployerProfileDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: "Invalid phone number format" })
  phone?: string;

  @IsOptional()
  @IsString()
  company_logo?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  profile_pic?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
