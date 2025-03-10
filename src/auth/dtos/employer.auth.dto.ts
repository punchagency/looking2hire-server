import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsPhoneNumber,
  IsArray,
  IsEnum,
  ValidateIf,
  IsNotEmpty,
  isNotEmpty,
} from "class-validator";

export class SendOTPDto {
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsNotEmpty({ message: "Context is required" })
  @IsString()
  @IsEnum(["forgot-password", "signup"], {
    message: "Invalid context option",
  })
  context: string;
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
}

export class EmployerSignupDto {
  @IsString()
  company_name: string;

  @IsString()
  full_name: string;

  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @IsPhoneNumber(undefined, { message: "Invalid phone number format" })
  phone: string;
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

export class UpdateEmployerDto {
  @IsString()
  company_name?: string;

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

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email format" })
  email?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: "Invalid phone number format" })
  phone?: string;
}
