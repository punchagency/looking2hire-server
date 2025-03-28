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
import mongoose from "mongoose";
import { sendEmail } from "../../common/utils/sendGridEmail";
import { generateOTP } from "../../common/utils/otp.util";
import {
  ApplicantDto,
  ApplicantSigninDto,
  ApplicantSignupDto,
  EmployerSigninDto,
  EmployerSignupDto,
  SendOTPDto,
  UpdateEmployerProfileDto,
  VerifyOtpDto,
  UpdateApplicantDto,
} from "../dtos/auth.dto";

@Service()
export class AuthService {
  private clientId = env.linkedinClientId;
  private clientSecret = env.linkedinClientSecret;
  private redirectUri = `${env.frontendUrl}/${env.authRedirectUri}linkedin`;
  private tokenEndpoint = "https://www.linkedin.com/oauth/v2/accessToken";
  private applicantInfoEndpoint = "https://api.linkedin.com/v2/userinfo";

  async findApplicantByEmail(email: string) {
    try {
      // Check both collections for existing user
      const [applicant, employer] = await Promise.all([
        ApplicantModel.findOne({ email }),
        EmployerModel.findOne({ email }),
      ]);

      if (employer) {
        throw new Error("This email is registered as an employer");
      }

      return applicant;
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
        { expiresIn: 604800 } // 1 hour
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

  // common

  async refreshToken(oldRefreshToken: string) {
    try {
      const decoded: any = jwt.verify(oldRefreshToken, env.refreshSecret);
      const newAccessToken = jwt.sign({ id: decoded.id }, env.jwtSecret, {
        expiresIn: 604800,
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

      // Check both collections for existing user
      const [existingEmployer, existingApplicant] = await Promise.all([
        EmployerModel.findOne({ $or: query }),
        ApplicantModel.findOne({ email: data.email }),
      ]);

      if (existingApplicant) {
        throw new Error("This email is already registered as an applicant");
      }

      if (existingEmployer && existingEmployer.isVerified) {
        throw new Error(
          "User already exists. Email or Phone Number already registered"
        );
      }

      console.log("employerSignup", { existingEmployer });
      if (!existingEmployer) {
        const emp = await EmployerModel.create(data);
        console.log({ emp });
      }

      return await this.sendOTP({
        email: data.email,
        context: "signup",
        userType: "employer",
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signup failed: ${error.message}`);
      } else {
        throw new Error("Signup failed: An unknown error occurred");
      }
    }
  }

  async applicantSignup(data: ApplicantSignupDto): Promise<string> {
    try {
      const query: any = [{ email: data.email }];

      // Check both collections for existing user
      const [existingApplicant, existingEmployer] = await Promise.all([
        ApplicantModel.findOne({ $or: query }),
        EmployerModel.findOne({ email: data.email }),
      ]);

      if (existingEmployer) {
        throw new Error("This email is already registered as an employer");
      }

      if (existingApplicant) {
        const accountExists = !!(
          existingApplicant.googleId || existingApplicant.linkedinId
        );
        if (accountExists) {
          if (!existingApplicant.password) {
            throw new Error("Please link existing account.");
          }
          throw new Error("User already exists. Email already registered.");
        }
      }

      if (!existingApplicant) await ApplicantModel.create(data);

      return await this.sendOTP({
        email: data.email,
        context: "signup",
        userType: "applicant",
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signup failed: ${error.message}`);
      } else {
        throw new Error("Signup failed: An unknown error occurred");
      }
    }
  }

  async linkPassword(data: ApplicantSignupDto) {
    try {
      const existingUser = await ApplicantModel.findOne({ email: data.email });
      if (!existingUser) {
        throw new Error("User not found.");
      }
      const accountExists = !!(
        existingUser.googleId || existingUser.linkedinId
      );
      if (!accountExists) {
        throw new Error("User has not previously signed up.");
      }
      if (existingUser.password) {
        throw new Error("User already has a password. Try logging in.");
      }

      existingUser.password = data.password;
      await existingUser.save();
      return await this.sendOTP({
        email: data.email,
        context: "signup",
        userType: "applicant",
      });
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

      const loginDetails = this.generateTokens(employer);
      return {
        accessToken: loginDetails.accessToken,
        refreshToken: loginDetails.refreshToken,
        employer: loginDetails.user,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signin failed: ${error.message}`);
      } else {
        throw new Error("Signin failed: An unknown error occurred");
      }
    }
  }

  async applicantSignin(data: ApplicantSigninDto): Promise<{
    accessToken: string;
    refreshToken: string;
    applicant: any;
  }> {
    try {
      const query: any = [{ email: data.email }];

      const applicant = await ApplicantModel.findOne({ $or: query });
      if (!applicant) throw new Error("Invalid credentials");

      const isMatch = await applicant.comparePassword(data.password);
      if (!isMatch) throw new Error("Invalid credentials");

      if (applicant.isVerified === false) throw new Error("User not verified");

      const loginDetails = this.generateTokens(applicant);
      return {
        accessToken: loginDetails.accessToken,
        refreshToken: loginDetails.refreshToken,
        applicant: loginDetails.user,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Signin failed: ${error.message}`);
      } else {
        throw new Error("Signin failed: An unknown error occurred");
      }
    }
  }

  private async sendOTPEmail(email: string, otp: string) {
    try {
      const subject = "Your OTP for Looking2Hire";
      const text = `Your OTP is: ${otp}. This code will expire in 5 minutes.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your OTP for Looking2Hire</h2>
          <p>Your OTP is: <strong>${otp}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new Error("Failed to send OTP email. Please try again later.");
    }
  }

  async sendOTP(data: SendOTPDto): Promise<string> {
    if (data.userType === "employer") {
      const employer = await EmployerModel.findOne({ email: data.email });
      console.log({ email: data.email, employer });
      if (data.context === "signup") {
        if (!employer) throw new Error("User does not exist");
        if (employer.isVerified) throw new Error("User is already verified");
      }
      if (data.context === "forgot-password") {
        if (!employer) throw new Error("User does not exist");
        if (!employer.isVerified) throw new Error("User is not registered yet");
      }
    } else if (data.userType === "applicant") {
      const applicant = await ApplicantModel.findOne({ email: data.email });
      if (data.context === "signup") {
        if (!applicant) throw new Error("User does not exist");
        if (applicant.isVerified) throw new Error("User is already verified");
      }
      if (data.context === "forgot-password") {
        if (!applicant) throw new Error("User does not exist");
        if (!applicant.isVerified)
          throw new Error("User is not registered yet");
      }
    }

    await OTPModel.deleteMany({ email: data.email });
    const otpCode = generateOTP();
    await OTPModel.create({
      email: data.email,
      otpCode,
    });
    await this.sendOTPEmail(data.email, otpCode);
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
        if (data.userType === "employer") {
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
        } else if (data.userType === "applicant") {
          const applicant = await ApplicantModel.findOne({
            email: data.email,
          }).session(session);
          if (!applicant) throw new Error("User details not found");

          await ApplicantModel.findByIdAndUpdate(
            applicant._id,
            { $set: { isVerified: true } },
            { new: true } // Return updated user and ensure session is used
          ).session(session);
        }
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

  async updateEmployerProfile(
    employerId: string,
    data: UpdateEmployerProfileDto
  ) {
    try {
      return await EmployerModel.findOneAndUpdate({ _id: employerId }, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Employer profile update failed: ${error.message}`);
      } else {
        throw new Error(
          "Employer profile update failed: An unknown error occurred"
        );
      }
    }
  }

  async updateApplicantProfile(applicantId: string, data: UpdateApplicantDto) {
    try {
      return await ApplicantModel.findOneAndUpdate({ _id: applicantId }, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Applicant profile update failed: ${error.message}`);
      } else {
        throw new Error(
          "Applicant profile update failed: An unknown error occurred"
        );
      }
    }
  }

  private generateTokens(user: any): {
    accessToken: string;
    refreshToken: string;
    user: any;
  } {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = jwt.sign({ id: user._id }, env.refreshSecret, {
      expiresIn: 604800,
    });

    const userObject = { ...user.toObject() };
    delete userObject.password;
    return { accessToken, refreshToken, user: userObject };
  }

  private generateAccessToken(user: any): string {
    return jwt.sign({ id: user._id, email: user.email }, env.jwtSecret, {
      expiresIn: 604800,
    });
  }

  async getUserDetails(userId: string, userType: "employer" | "applicant") {
    try {
      let user;
      if (userType === "employer") {
        user = await EmployerModel.findById(userId).select("-password");
      } else {
        user = await ApplicantModel.findById(userId).select("-password");
      }

      if (!user) {
        throw new Error(`${userType} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch ${userType} details: ${error.message}`
        );
      } else {
        throw new Error(
          `Failed to fetch ${userType} details: An unknown error occurred`
        );
      }
    }
  }

  async getEmployerById(employerId: string) {
    try {
      const employer = await EmployerModel.findById(employerId).select(
        "-password"
      );

      if (!employer) {
        throw new Error("Employer not found");
      }

      return employer;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch employer details: ${error.message}`);
      } else {
        throw new Error(
          "Failed to fetch employer details: An unknown error occurred"
        );
      }
    }
  }
}
