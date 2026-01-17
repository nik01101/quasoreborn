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

        // Helper to read S3 stream
        const streamToString = (stream: any) =>
            new Promise<string>((resolve, reject) => {
                const chunks: any[] = [];
                stream.on('data', (chunk: any) => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            });

        // Initial ytdl options
        const ytdlOptions: any = {
            filter: 'audioonly',
            quality: 'highestaudio',
        };

        let agent: any = null;

        // 1. Try S3 Config File first (Best for large cookies)
        try {
            console.log(`Checking S3 for config/cookies.json in ${bucketName}...`);
            const { GetObjectCommand } = await import('@aws-sdk/client-s3'); // Dynamic import to keep init fast

            const configResponse = await s3Client.send(new GetObjectCommand({
                Bucket: bucketName,
                Key: 'config/cookies.json'
            }));

            if (configResponse.Body) {
                const configString = await streamToString(configResponse.Body);
                const cookies = JSON.parse(configString);
                agent = ytdl.createAgent(cookies);
                console.log('Successfully loaded agent from S3 cookies.json');
            }
        } catch (s3Error: any) {
            console.log('No S3 cookies found or error reading (normal if not uploaded):', s3Error.message);
        }

        // 2. Fallback to Env Var (for small cookies)
        if (!agent && process.env.YOUTUBE_COOKIES) {
            try {
                const cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
                agent = ytdl.createAgent(cookies);
                console.log('Loaded agent from Environment Variable');
            } catch (e) {
                console.warn('Failed to parse YOUTUBE_COOKIES env var:', e);
            }
        }

        if (agent) {
            ytdlOptions.agent = agent;
            console.log('Authentication agent configured successfully with verified cookies.');
        } else {
            console.log('WARNING: No authentication agent configured. Download may fail with bot detection.');
        }

        // Create a PassThrough stream
        const passThrough = new PassThrough();

        // Start the upload to S3 using the stream
        console.log(`Starting S3 upload to bucket: ${bucketName}, key: ${s3Key}`);
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
        console.log(`Initiating YouTube stream for URL: ${videoUrl}`);
        ytdl(videoUrl, ytdlOptions)
            .on('info', (info) => console.log(`Video Info Received: ${info.videoDetails.title}`))
            .on('error', (err) => console.error('YTDL Stream Error:', err))
            .pipe(passThrough);

        // Wait for the upload to complete
        await upload.done();
        console.log('Upload process completed successfully!');

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
