import { Service } from "typedi";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import util from "util";
import { Readable } from "stream";
import { env } from "../../config/env";
import { parseResume } from "../../common/utils/resumeParse.util";

const unlinkFile = util.promisify(fs.unlink);

@Service()
export class ResumeService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: env.aws.accessKeyId,
        secretAccessKey: env.aws.secretAccessKey,
      },
      region: env.aws.region,
    });
  }

  async uploadToS3(file: Express.Multer.File): Promise<any> {
    const fileExtension = path.extname(file.originalname);
    const fileKey = `resumes/${uuidv4()}${fileExtension}`;
    const filePath = file.path;

    try {
      // Upload file to S3
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: env.aws.bucketName,
          Key: fileKey,
          Body: fs.createReadStream(filePath),
          ContentType: file.mimetype,
        },
      });

      await upload.done();
      await unlinkFile(filePath); // Remove local file after successful upload

      const fileUrl = `https://${env.aws.bucketName}.s3.amazonaws.com/${fileKey}`;
      // console.log({ fileUrl });

      // Download file from S3 and parse resume
      const parsedData = await this.parseResume(fileKey);
      // console.log({ parsedData });

      return parsedData;
    } catch (error) {
      console.error("Error in uploadToS3:", error);

      // If upload was successful but parsing failed, delete from S3
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.aws.bucketName,
            Key: fileKey,
          })
        );
        console.log(`Deleted file from S3: ${fileKey}`);
      } catch (deleteError) {
        console.error("Failed to delete file from S3:", deleteError);
      }

      throw new Error("Failed to upload and parse resume.");
    }
  }

  async parseResume(fileKey: string): Promise<any> {
    try {
      // Download file from S3
      const filePath = await this.downloadFileFromS3(fileKey);

      // Parse resume using OpenAI
      const parsedData = await parseResume(filePath);

      // Cleanup: Delete the downloaded file
      await unlinkFile(filePath);

      return parsedData;
    } catch (error) {
      console.error("Error in parseResume:", error);
      throw new Error("Failed to parse resume.");
    }
  }

  private async downloadFileFromS3(fileKey: string): Promise<string> {
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, fileKey.split("/").pop()!);

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: env.aws.bucketName,
        Key: fileKey,
      })
    );

    if (!response.Body) throw new Error("Empty response body");

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filePath);
      const readableStream = Readable.from(response.Body as any);
      readableStream
        .pipe(fileStream)
        .on("finish", () => resolve(filePath))
        .on("error", reject);
    });
  }
}
