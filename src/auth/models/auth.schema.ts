import { prop, Ref } from "@typegoose/typegoose";

export class User {
  @prop({ unique: true, sparse: true })
  googleId?: string;

  @prop({ unique: true, sparse: true })
  linkedinId?: string;

  @prop({ required: true })
  name: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop()
  avatar?: string;
}

export class AuthCode {
  @prop({ required: true, unique: true })
  code: string;

  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ default: () => new Date(Date.now() + 5 * 60 * 1000) }) // 5 min expiration
  expiresAt: Date;
}
