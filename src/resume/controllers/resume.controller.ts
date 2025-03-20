import { NextFunction, Response } from "express";
import { Service } from "typedi";
import { ResumeService } from "../services/resume.service";
import { MulterRequest } from "../../common/middlewares/auth.middleware";

@Service()
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  async uploadResume(
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }
      const parsedData = await this.resumeService.uploadToS3(req.file);
      res.status(201).json({ success: true, parsedData });
    } catch (error: any) {
      next(error);
    }
  }
}
