import sgMail from "@sendgrid/mail";
import { env } from "../../config/env";
import { MailDataRequired } from "@sendgrid/mail";

// Set API Key
sgMail.setApiKey(env.sendGridKey as string);

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
  try {
    const msg: MailDataRequired = {
      to,
      from: "looking2hire@punch.cool",
      subject,
      content: [
        { type: "text/plain", value: text || "" },
        ...(html ? [{ type: "text/html", value: html }] : []),
      ],
    };

    console.log("Attempting to send email with config:", {
      to,
      from: msg.from,
      subject,
      hasText: !!text,
      hasHtml: !!html,
      sendGridKey: env.sendGridKey ? "Present" : "Missing",
    });

    const response = await sgMail.send(msg);
    console.log("SendGrid Response:", JSON.stringify(response, null, 2));
  } catch (error: any) {
    console.error("SendGrid Error Details:", {
      message: error.message,
      response: error.response?.body,
      statusCode: error.response?.statusCode,
      headers: error.response?.headers,
    });
    throw error; // Re-throw to handle in the service
  }
};
