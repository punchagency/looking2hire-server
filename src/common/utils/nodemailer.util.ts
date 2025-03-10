import { transporter } from "../../config/nodemailer-config";
import { env } from "../../config/env";

export const sendOTPEmail = async (to: string, otp: string) => {
  const subject = "Your OTP Code for Verification";
  const text = `
    Dear User,

    Your One-Time Password (OTP) for verification is: ${otp}

    This OTP is valid for 5 minutes. Please do not share it with anyone.

    If you did not request this OTP, please ignore this email.

    Best regards,  
    The Support Team
  `;

  const res = await transporter.sendMail({
    from: `No-Reply <${env.smtp.user}>`,
    to,
    subject,
    text,
  });

  console.log(`OTP sent to ${to}: ${otp}`);
};
