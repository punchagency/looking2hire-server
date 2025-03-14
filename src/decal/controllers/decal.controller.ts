import { Service } from "typedi";
import { Response, NextFunction } from "express";
import { validateOrReject } from "class-validator";
import { DecalService } from "../services/decal.service";
import { DecalDto, ScanDto } from "../dtos/decal.dto";
import { ApiError } from "../../common/middlewares/error.middleware";
import { AuthRequest } from "../../common/middlewares/auth.middleware";

@Service()
export class DecalController {
  constructor(private readonly decalService: DecalService) {}

  async createDecal(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new DecalDto(), req.body);
      await validateOrReject(data);
      const decal = await this.decalService.createDecal(req.user.id, data);
      res.status(201).json({ success: true, decal });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }
  async scanDecal(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = Object.assign(new ScanDto(), req.body);
      await validateOrReject(data);
      const scan = await this.decalService.scanDecal(req.user.id, data);
      res.status(201).json({ success: true, scan });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }

  async getScansByDecal(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { decalId } = req.params;
      const scans = await this.decalService.getScansByDecal(decalId);
      res.status(200).json({ success: true, scans });
    } catch (error: any) {
      next(new ApiError(error, 400));
    }
  }
}
