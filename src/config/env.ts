import dotenv from "dotenv";
dotenv.config();

export const env = {
  server_port: process.env.SERVER_PORT || 5000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET!,
  refreshSecret: process.env.REFRESH_SECRET!,

  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,

  linkedinClientId: process.env.LINKEDIN_CLIENT_ID!,
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET!,

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  authRedirectUri: process.env.AUTH_REDIRECT_URI!,

  smtp: {
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
};
