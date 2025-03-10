import crypto from "crypto";

export const generateOTP = (): string => {
  return crypto.randomInt(1000, 9999).toString();
};
