import { prop, Ref } from "@typegoose/typegoose";
import { Applicant, Employer } from "../../auth/models/auth.schema";

export class Decal {
  @prop({ required: true, ref: () => Employer })
  employerId: Ref<Employer>;

  @prop({ required: true, unique: true })
  nfcTagId: string;
}

export class Scan {
  @prop({ required: true, ref: () => Applicant })
  applicantId: Ref<Applicant>;

  @prop({ required: true, ref: () => Decal })
  decalId: Ref<Decal>;
}
