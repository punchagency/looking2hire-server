import nodemailer from "nodemailer";
import { env } from "./env";

export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: true,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});
