import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../../config/env";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 5000, // 5 seconds
    socketTimeout: 30000, // 30 seconds
  },
});

export async function uploadToS3(
  file: Express.Multer.File,
  folder: string
): Promise<string> {
  try {
    const fileExtension = file.originalname.split(".").pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: env.aws.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: "public-read",
    });

    await s3Client.send(command);

    return `https://${env.aws.bucketName}.s3.${env.aws.region}.amazonaws.com/${key}`;
  } catch (error: any) {
    console.error("S3 Upload Error:", error);
    throw new Error(
      `Failed to upload file to S3: ${error.message || "Unknown error"}`
    );
  }
}
