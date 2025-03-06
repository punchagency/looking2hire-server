import { IsEmail, IsOptional, IsString } from "class-validator";

export class AuthDto {
  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  linkedinId?: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;
}
