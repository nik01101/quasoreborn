import { type Schema } from '../../data/resource';
import ytdl from '@distube/ytdl-core';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';

const s3Client = new S3Client({});

export const handler: any = async (event: any) => {
    const { youtubeId } = event.arguments;
    const bucketName = process.env.MUSIC_DRIVE_BUCKET_NAME;

    if (!bucketName) {
        throw new Error('MUSIC_DRIVE_BUCKET_NAME is not set');
    }

    try {
        // Switch to /tmp so ytdl can write its cache files
        process.chdir('/tmp');

        const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        const s3Key = `tracks/${youtubeId}.mp3`;

        // Configure ytdl options
        const ytdlOptions: any = {
            filter: 'audioonly',
            quality: 'highestaudio',
        };

        // If cookies are provided, create an agent
        // Valid cookies look like: [{ name: "cookie1", value: "value1" }, ...]
        if (process.env.YOUTUBE_COOKIES) {
            try {
                const cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
                const agent = ytdl.createAgent(cookies);
                ytdlOptions.agent = agent;
                console.log('Using authenticated agent with cookies');
            } catch (e) {
                console.warn('Failed to parse YOUTUBE_COOKIES, proceeding without auth:', e);
            }
        }

        // Create a PassThrough stream
        const passThrough = new PassThrough();

        // Start the upload to S3 using the stream
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: s3Key,
                Body: passThrough,
                ContentType: 'audio/mpeg',
            },
        });

        // Pipe the YouTube audio stream to the PassThrough stream
        ytdl(videoUrl, ytdlOptions).pipe(passThrough);

        // Wait for the upload to complete
        await upload.done();

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
