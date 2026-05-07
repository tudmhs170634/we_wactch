import { Injectable } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
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

        const presignedUrl = await getSignedUrl(this.client, command, { expiresIn });
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

    getPublicUrl(key: string): string {
        return `${this.cdnUrl}/${key}`;
    }
}
