import { getModelForClass } from "@typegoose/typegoose";
import { AuthCode, User } from "./auth.schema";

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
});

export const AuthCodeModel = getModelForClass(AuthCode, {
  schemaOptions: { timestamps: true },
});
