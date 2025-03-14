import { getModelForClass } from "@typegoose/typegoose";
import { Decal, Scan } from "./decal.schema";

export const DecalModel = getModelForClass(Decal, {
  schemaOptions: { timestamps: true },
});

export const ScanModel = getModelForClass(Scan, {
  schemaOptions: { timestamps: true },
});
