import { Schema } from '../data/resource';
import ytDlp from 'yt-dlp-exec';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const s3Client = new S3Client({});

export const handler: Schema['song-download']['Handler'] = async (event) => {
    const { youtubeId, title, artist } = event.arguments;
    const bucketName = process.env.MUSIC_DRIVE_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('MUSIC_DRIVE_BUCKET_NAME is not set');
    }

    const tempFilePath = path.join('/tmp', `${youtubeId}.mp3`);

    try {
        // Using yt-dlp to download and convert to 128kbps mp3
        // Note: Lambda needs ffmpeg layer or we need to bundle it.
        // Simplifying for now assuming ffmpeg is available in environment or layer.
        await ytDlp(`https://www.youtube.com/watch?v=${youtubeId}`, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '128K',
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

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

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
