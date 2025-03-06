import { Service } from "typedi";
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { AuthService } from "../services/auth.service";
import { env } from "../../config/env";
import { ApiError } from "../../common/middlewares/error.middleware";
import { randomBytes } from "crypto";
import axios from "axios";

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
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ accessToken });
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

      res.status(200).json({ authCode });
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
      res.status(200).json({ accessToken: newAccessToken });
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
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await this.authService.getAllUsers();
      res.status(200).json(users);
    } catch (error: any) {
      next(new ApiError(error, 500));
    }
  }
}
