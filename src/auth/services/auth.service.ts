import { Service } from "typedi";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UserModel, AuthCodeModel } from "../models/auth.model";
import { AuthDto } from "../dtos/auth.dto";
import { randomBytes } from "crypto";
import axios from "axios";

@Service()
export class AuthService {
  private clientId = env.linkedinClientId;
  private clientSecret = env.linkedinClientSecret;
  private redirectUri = `${env.frontendUrl}/${env.authRedirectUri}linkedin`;
  private tokenEndpoint = env.linkedinTokenEndpoint;
  private userInfoEndpoint = env.linkedinUserInfoEndpoint;

  async findUserByEmail(email: string) {
    try {
      return await UserModel.findOne({ email });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find user by email: ${error.message}`);
      } else {
        throw new Error(
          "Failed to find user by email: An unknown error occurred"
        );
      }
    }
  }

  async createUser(data: AuthDto) {
    try {
      return await UserModel.create(data);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`);
      } else {
        throw new Error("Failed to create user: An unknown error occurred");
      }
    }
  }

  async linkGoogleAccount(userId: string, googleId: string) {
    try {
      return await UserModel.findByIdAndUpdate(
        userId,
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

  async linkLinkedInAccount(userId: string, linkedinId: string) {
    try {
      return await UserModel.findByIdAndUpdate(
        userId,
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

  async generateAuthCode(userId: string) {
    try {
      const authCode = randomBytes(16).toString("hex");

      await AuthCodeModel.create({ code: authCode, userId });

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
        { id: authCodeEntry.userId },
        env.jwtSecret,
        { expiresIn: 3600 } // 1 hour
      );

      const refreshToken = jwt.sign(
        { id: authCodeEntry.userId },
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
      const userInfo = await this.fetchLinkedinUserInfo(accessToken);
      const user = await this.findOrCreateUser(userInfo);
      return await this.generateAuthCode(user.id);
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

  private async fetchLinkedinUserInfo(accessToken: string) {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch LinkedIn user info: ${error.message}`);
      } else {
        throw new Error(
          "Failed to fetch LinkedIn user info: An unknown error occurred"
        );
      }
    }
  }

  private async findOrCreateUser(userInfo: any) {
    try {
      let user = await this.findUserByEmail(userInfo.email);
      if (user) {
        if (!user.linkedinId) {
          user = await this.linkLinkedInAccount(user.id, userInfo.sub);
        }
      } else {
        user = await this.createUser({
          linkedinId: userInfo.sub,
          name: userInfo.name,
          email: userInfo.email,
        });
      }
      if (!user) {
        throw new Error("Failed to create or find user");
      }
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find or create user: ${error.message}`);
      } else {
        throw new Error(
          "Failed to find or create user: An unknown error occurred"
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

  async getAllUsers() {
    try {
      return await UserModel.find();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      } else {
        throw new Error("Failed to fetch users: An unknown error occurred");
      }
    }
  }
}
