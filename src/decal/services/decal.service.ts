import { Service } from "typedi";
import { DecalModel, ScanModel } from "../models/decal.model";
import { DecalDto, ScanDto } from "../dtos/decal.dto";

@Service()
export class DecalService {
  async createDecal(employerId: string, data: DecalDto) {
    try {
      return await DecalModel.create({ ...data, employerId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decal creation failed: ${error.message}`);
      } else {
        throw new Error("Decal creation failed: An unknown error occurred");
      }
    }
  }

  async scanDecal(applicantId: string, data: ScanDto) {
    try {
      return await ScanModel.create({ ...data, applicantId });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Decal scanning failed: ${error.message}`);
      } else {
        throw new Error("Decal scanning failed: An unknown error occurred");
      }
    }
  }

  async getScansByDecal(decalId: string) {
    try {
      return await ScanModel.find({ decalId }).lean();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve scans: ${error.message}`);
      } else {
        throw new Error("Failed to retrieve scans: An unknown error occurred");
      }
    }
  }
}
