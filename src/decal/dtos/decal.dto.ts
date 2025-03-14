import { IsString } from "class-validator";

export class DecalDto {
  @IsString()
  nfcTagId: string;
}

export class ScanDto {
  @IsString()
  decalId: string;
}
