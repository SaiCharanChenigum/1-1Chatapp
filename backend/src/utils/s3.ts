import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
});

export const uploadFileToR2 = async (file: Express.Multer.File): Promise<string> => {
    const fileName = `${Date.now()}-${file.originalname}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    // If using a public CDN/Custom Domain
    if (process.env.CDN_URL) {
        return `${process.env.CDN_URL}/${fileName}`;
    }

    // Otherwise return the public R2 URL (if bucket is public) or we would generate a signed url
    // For this chat app, assuming public bucket for simplicity or mapped domain
    return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${fileName}`;
};
