import { Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { AuthService } from "../services/auth.service";
import { env } from "../../config/env";
import { ApiError } from "../../common/middlewares/error.middleware";
import { validateOrReject } from "class-validator";
import {
  EmployerSigninDto,
  EmployerSignupDto,
  SendOTPDto,
  VerifyOtpDto,
} from "../dtos/employer.dto";

@Service()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  googleAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("google", { scope: ["profile", "email"] })(
      req,
      res,
      next
    );
  }

  googleAuthCallback(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate("google", { session: false }, async (err, result) => {
      try {
        if (err) return next(new ApiError(err.message, 500));
        if (!result || !result.authCode)
          return res.status(401).json({ message: "Authentication failed" });

        res.redirect(
          `${env.frontendUrl}/auth-success?provider=google&code=${result.authCode}`
        );
      } catch (error: any) {
        next(new ApiError(error, 500));
      }
    })(req, res, next);
  }

  linkedinAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("linkedin")(req, res, next);
  }

  // linkedinAuthCallback(req: Request, res: Response, next: NextFunction): void {
  //   passport.authenticate(
  //     "linkedin",
  //     { session: false, failureRedirect: "/" },
  //     async (err: Error | null, result: { authCode: string } | null) => {
  //       try {
  //         console.log("rannnnn");
  //         const { code } = req.query;
  //         // console.log("code", code);
  //         const tokenResponse = await axios.post(
  //           "https://www.linkedin.com/oauth/v2/accessToken",
  //           null,
  //           {
  //             params: {
  //               grant_type: "authorization_code",
  //               code,
  //               redirect_uri: "http://localhost:3000/upload",
  //               client_id: "773yr5avmlgupy",
  //               client_secret: "WPL_AP1.VJyRwyJLSpAUww4Z.k3fvdw==",
  //             },
  //             headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //           }
  //         );
  //         // console.log("Token Response:", tokenResponse.data);

  //         const accessToken = tokenResponse.data.access_token;

  //         const userInfoResponse = await axios.get(
  //           "https://api.linkedin.com/v2/userinfo",
  //           {
  //             headers: { Authorization: `Bearer ${accessToken}` },
  //           }
  //         );

  //         console.log("userInfoResponse", userInfoResponse.data);
  //         res.json(userInfoResponse.data);
  //       } catch (error) {
  //         console.error("LinkedIn Authentication Error:", error);
  //         res
  //           .status(500)
  //           .json({ error: "Failed to authenticate with LinkedIn" });
  //       }
  //     }
  //   )(req, res, next);
  // }

  async exchangeAuthCode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) throw new Error("Auth code required");

      const { accessToken, refreshToken } =
        await this.authService.exchangeAuthCodeForTokens(code);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ success: true, accessToken });
    } catch (error: any) {
      next(new ApiError(error, 401));
    }
  }

  async handleLinkedinAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code } = req.body;
      if (!code) throw new Error("Auth code required");

      const authCode = await this.authService.handleLinkedinAuth(code);

      res.status(200).json({ success: true, authCode });
    } catch (error: any) {
      next(new ApiError(error, 401));
    }
  }

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error("Invalid or expired refresh token");

      const newAccessToken = await this.authService.refreshToken(refreshToken);
      res.status(200).json({ success: true, accessToken: newAccessToken });
    } catch (error: any) {
      next(new ApiError(error, 401));
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  // EMPLOYER

  async employerSignup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new EmployerSignupDto(), req.body);
      await validateOrReject(data);
      await this.authService.employerSignup(data);
      res.status(201).json({
        success: true,
        message:
          "OTP sent to your email. Please verify to complete registration.",
      });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async employerSignin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new EmployerSigninDto(), req.body);
      await validateOrReject(data);
      const signInDetails = await this.authService.employerSignin(data);
      res.cookie("refreshToken", signInDetails.refreshToken, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === "production", // change to secure: true -> ensures it works only over HTTPS
        sameSite: "strict", // Prevents CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.status(200).json({
        success: true,
        employer: signInDetails.employer,
        accessToken: signInDetails.accessToken,
      });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async sendOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new SendOTPDto(), req.body);
      await validateOrReject(data);
      const message = await this.authService.sendOTP(data);
      res.status(200).json({ success: true, message });
    } catch (error: any) {
      next(new ApiError(error, 403));
    }
  }

  async verifyOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new VerifyOtpDto(), req.body);
      await validateOrReject(data);
      const user = await this.authService.verifyOTP(data);
      res.status(201).json({ success: true, user });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getAllApplicants(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const applicants = await this.authService.getAllApplicants();
      res.status(200).json(applicants);
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }
}
