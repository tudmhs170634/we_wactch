import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor() {
    this.bucket = process.env.DO_SPACES_BUCKET!;
    this.cdnUrl = process.env.DO_SPACES_CDN_URL!;
    this.client = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION ?? 'sgp1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!,
      },
      forcePathStyle: false,
    });
    this.setPublicBucketPolicy();
  }

  async setPublicBucketPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${this.bucket}/livestream/*`,
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: this.bucket,
      Policy: JSON.stringify(policy),
    });

    try {
      await this.client.send(command);
      console.log(`Successfully set public bucket policy for livestream/ folder in ${this.bucket}`);
    } catch (error) {
      console.error('Failed to set bucket policy:', error);
    }
  }

  async getPresignedUploadUrl(
    folder: string,
    mimeType: string,
    expiresIn = 300,
  ): Promise<{ presignedUrl: string; key: string; publicUrl: string }> {
    const ext = mimeType.split('/')[1] ?? 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    const presignedUrl = await getSignedUrl(this.client, command, {
      expiresIn,
    });
    const publicUrl = `${this.cdnUrl}/${key}`;

    return { presignedUrl, key, publicUrl };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `${this.cdnUrl}/${key}`;
  }

  async downloadFile(key: string, destPath: string): Promise<void> {
    const { createWriteStream } = await import('fs');
    const { pipeline } = await import('stream/promises');

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) throw new Error('Empty response body');

    const writeStream = createWriteStream(destPath);
    await pipeline(response.Body as any, writeStream);
  }

  async uploadFile(
    key: string,
    filePath: string,
    contentType: string,
  ): Promise<string> {
    const { createReadStream } = await import('fs');

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
      ACL: 'public-read',
    });
    await this.client.send(command);
    return `${this.cdnUrl}/${key}`;
  }
}
