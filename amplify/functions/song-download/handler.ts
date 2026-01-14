import { type Schema } from '../../data/resource';
import ytDlp from 'yt-dlp-exec';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const s3Client = new S3Client({});

export const handler: any = async (event: any) => {
    const { youtubeId } = event.arguments;
    const bucketName = process.env.MUSIC_DRIVE_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('MUSIC_DRIVE_BUCKET_NAME is not set');
    }

    const tempFilePath = path.join('/tmp', `${youtubeId}.mp3`);

    try {
        await ytDlp(`https://www.youtube.com/watch?v=${youtubeId}`, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 5,
            output: tempFilePath,
        });

        const fileBuffer = fs.readFileSync(tempFilePath);
        const s3Key = `tracks/${youtubeId}.mp3`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: 'audio/mpeg',
            })
        );

        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        return {
            success: true,
            s3Key,
        };
    } catch (error) {
        console.error('Download error:', error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
};
