import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "../../config/env";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
  region: env.aws.region,
});

export async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  try {
    const fileKey = `${folder}/${uuidv4()}-${file.originalname}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: env.aws.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();
    return `https://${env.aws.bucketName}.s3.${env.aws.region}.amazonaws.com/${fileKey}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
    throw new Error("Failed to upload to S3: An unknown error occurred");
  }
}
