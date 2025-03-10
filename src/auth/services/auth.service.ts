import { Service } from "typedi";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  ApplicantModel,
  AuthCodeModel,
  EmployerModel,
  OTPModel,
} from "../models/auth.model";
import { randomBytes } from "crypto";
import axios from "axios";
import { ApplicantDto } from "../dtos/applicant.dto";
import {
  EmployerSignupDto,
  EmployerSigninDto,
  SendOTPDto,
  VerifyOtpDto,
} from "../dtos/employer.dto";
import mongoose from "mongoose";
import { sendOTPEmail } from "../../common/utils/nodemailer.util";
import { generateOTP } from "../../common/utils/otp.util";
@Service()
export class AuthService {
  private clientId = env.linkedinClientId;
  private clientSecret = env.linkedinClientSecret;
  private redirectUri = `${env.frontendUrl}/${env.authRedirectUri}linkedin`;
  private tokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";
  private applicantInfoEndpoint = "https://api.linkedin.com/v2/userinfo";

  async findApplicantByEmail(email: string) {
    try {
      return await ApplicantModel.findOne({ email });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find applicant by email: ${error.message}`);
      } else {
        throw new Error(
          "Failed to find applicant by email: An unknown error occurred"
        );
      }
    }
  }

  async createApplicant(data: ApplicantDto) {
    try {
      return await ApplicantModel.create(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create applicant: ${error.message}`);
      } else {
        throw new Error(
          "Failed to create applicant: An unknown error occurred"
        );
      }
    }
  }

  async linkGoogleAccount(applicantId: string, googleId: string) {
    try {
      return await ApplicantModel.findByIdAndUpdate(
        applicantId,
        { googleId },
        { new: true }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to link Google account: ${error.message}`);
      } else {
        throw new Error(
          "Failed to link Google account: An unknown error occurred"
        );
      }
    }
  }

  async linkLinkedInAccount(applicantId: string, linkedinId: string) {
    try {
      return await ApplicantModel.findByIdAndUpdate(
        applicantId,
        { linkedinId },
        { new: true }
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to link LinkedIn account: ${error.message}`);
      } else {
        throw new Error(
          "Failed to link LinkedIn account: An unknown error occurred"
        );
      }
    }
  }

  async generateAuthCode(applicantId: string) {
    try {
      const authCode = randomBytes(16).toString("hex");

      await AuthCodeModel.create({
        code: authCode,
        applicant_id: applicantId,
      });
      return authCode;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate auth code: ${error.message}`);
      } else {
        throw new Error(
          "Failed to generate auth code: An unknown error occurred"
        );
      }
    }
  }

  async exchangeAuthCodeForTokens(
    code: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const authCodeEntry = await AuthCodeModel.findOne({ code });

      if (!authCodeEntry || authCodeEntry.expiresAt < new Date()) {
        throw new Error("Invalid or expired auth code");
      }

      await AuthCodeModel.deleteOne({ code });

      const accessToken = jwt.sign(
        { id: authCodeEntry.applicant_id },
        env.jwtSecret,
        { expiresIn: 3600 } // 1 hour
      );

      const refreshToken = jwt.sign(
        { id: authCodeEntry.applicant_id },
        env.refreshSecret,
        { expiresIn: 604800 } // 7 days
      );

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to exchange auth code: ${error.message}`);
      } else {
        throw new Error(
          "Failed to exchange auth code: An unknown error occurred"
        );
      }
    }
  }

  async handleLinkedinAuth(code: string) {
    try {
      const accessToken = await this.exchangeLinkedinCodeForToken(code);
      const applicantInfo = await this.fetchLinkedinApplicantInfo(accessToken);
      const applicant = await this.findOrCreateApplicant(applicantInfo);
      return await this.generateAuthCode(applicant.id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to handle LinkedIn authentication: ${error.message}`
        );
      } else {
        throw new Error(
          "Failed to handle LinkedIn authentication: An unknown error occurred"
        );
      }
    }
  }

  private async exchangeLinkedinCodeForToken(code: string): Promise<string> {
    try {
      const tokenResponse = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      return tokenResponse.data.access_token;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to exchange LinkedIn code for token: ${error.message}`
        );
      } else {
        throw new Error(
          "Failed to exchange LinkedIn code for token: An unknown error occurred"
        );
      }
    }
  }

  private async fetchLinkedinApplicantInfo(accessToken: string) {
    try {
      const response = await axios.get(this.applicantInfoEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch LinkedIn applicant info: ${error.message}`
        );
      } else {
        throw new Error(
          "Failed to fetch LinkedIn applicant info: An unknown error occurred"
        );
      }
    }
  }

  private async findOrCreateApplicant(applicantInfo: any) {
    try {
      let applicant = await this.findApplicantByEmail(applicantInfo.email);
      if (applicant) {
        if (!applicant.linkedinId) {
          applicant = await this.linkLinkedInAccount(
            applicant.id,
            applicantInfo.sub
          );
        }
      } else {
        applicant = await this.createApplicant({
          linkedinId: applicantInfo.sub,
          name: applicantInfo.name,
          email: applicantInfo.email,
        });
      }
      if (!applicant) {
        throw new Error("Failed to create or find applicant");
      }
      return applicant;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find or create applicant: ${error.message}`);
      } else {
        throw new Error(
          "Failed to find or create applicant: An unknown error occurred"
        );
      }
    }
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const decoded: any = jwt.verify(oldRefreshToken, env.refreshSecret);
      const newAccessToken = jwt.sign({ id: decoded.id }, env.jwtSecret, {
        expiresIn: 3600,
      });

      return newAccessToken;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to refresh token: ${error.message}`);
      } else {
        throw new Error("Failed to refresh token: An unknown error occurred");
      }
    }
  }

  async getAllApplicants() {
    try {
      const [employers, applicants] = await Promise.all([
        EmployerModel.find(),
        ApplicantModel.find(),
      ]);

      return { employers, applicants };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch applicants: ${error.message}`);
      } else {
        throw new Error(
          "Failed to fetch applicants: An unknown error occurred"
        );
      }
    }
  }

  // EMPLOYER

  async employerSignup(data: EmployerSignupDto): Promise<string> {
    try {
      const query: any = [{ email: data.email }];
      if (data.phone) {
        query.push({ phone: data.phone });
      }

      const existingUser = await EmployerModel.findOne({ $or: query });

      if (existingUser && existingUser.isVerified)
        throw new Error(
          "User already exists. Email or Phone Number already registered"
        );

      if (!existingUser) await EmployerModel.create(data);

      return await this.sendOTP({ email: data.email, context: "signup" });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signup failed: ${error.message}`);
      } else {
        throw new Error("Signup failed: An unknown error occurred");
      }
    }
  }

  async employerSignin(data: EmployerSigninDto): Promise<{
    accessToken: string;
    refreshToken: string;
    employer: any;
  }> {
    try {
      const query: any = [{ email: data.email }];
      if (data.phone) {
        query.push({ phone: data.phone });
      }
      const employer = await EmployerModel.findOne({ $or: query });
      if (!employer) throw new Error("Invalid credentials");

      const isMatch = await employer.comparePassword(data.password);
      if (!isMatch) throw new Error("Invalid credentials");

      if (employer.isVerified === false) throw new Error("User not verified");

      return this.generateTokens(employer);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signin failed: ${error.message}`);
      } else {
        throw new Error("Signin failed: An unknown error occurred");
      }
    }
  }

  async sendOTP(data: SendOTPDto): Promise<string> {
    const employer = await EmployerModel.findOne({ email: data.email });
    if (data.context === "signup") {
      if (!employer) throw new Error("User does not exist");
      if (employer.isVerified) throw new Error("User is already verified");
    }
    if (data.context === "forgot-password") {
      if (!employer) throw new Error("User does not exist");
      if (!employer.isVerified) throw new Error("User is not registered yet");
    }

    await OTPModel.deleteMany({ email: data.email });
    const otpCode = generateOTP();
    await OTPModel.create({
      email: data.email,
      otpCode,
    });
    await sendOTPEmail(data.email, otpCode);
    return `OTP resent for ${data.context} successfully`;
  }

  async verifyOTP(data: VerifyOtpDto): Promise<string> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const otpRecord = await OTPModel.findOne({
        email: data.email,
        otpCode: data.otpCode,
      }).session(session);

      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new Error("Invalid or expired OTP");
      }

      await OTPModel.deleteMany({ email: data.email }).session(session);

      if (data.context === "signup") {
        const employer = await EmployerModel.findOne({
          email: data.email,
        }).session(session);
        if (!employer) throw new Error("User details not found");

        await EmployerModel.findByIdAndUpdate(
          employer._id,
          {
            $set: { isVerified: true },
          },
          { new: true } // Return updated user and ensure session is used
        ).session(session);
      }

      await session.commitTransaction();
      session.endSession();
      return "OTP Verified successfully";
    } catch (error) {
      await session.abortTransaction();

      if (error instanceof Error) {
        throw new Error(`OTP verification failed: ${error.message}`);
      } else {
        throw new Error("OTP verification failed: An unknown error occurred");
      }
    } finally {
      session.endSession();
    }
  }

  private generateTokens(employer: any): {
    accessToken: string;
    refreshToken: string;
    employer: any;
  } {
    const accessToken = this.generateAccessToken(employer);
    const refreshToken = jwt.sign({ id: employer._id }, env.refreshSecret, {
      expiresIn: 604800,
    });

    const employerObject = { ...employer.toObject() };
    delete employerObject.password;
    return { accessToken, refreshToken, employer: employerObject };
  }

  private generateAccessToken(employer: any): string {
    return jwt.sign(
      { id: employer._id, email: employer.email },
      env.jwtSecret,
      {
        expiresIn: 3600,
      }
    );
  }
}
