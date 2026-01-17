import { type Schema } from '../../data/resource';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { chmodSync } from 'fs';
import { Readable } from 'stream';

const s3Client = new S3Client({});

// Helper to convert stream to buffer/file
const downloadS3File = async (bucket: string, key: string, destPath: string) => {
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: key
        }));
        if (!response.Body) throw new Error('No body in S3 response');

        const fileStream = fs.createWriteStream(destPath);
        // @ts-ignore
        await new Promise((resolve, reject) => {
            (response.Body as Readable).pipe(fileStream)
                .on('error', reject)
                .on('finish', () => resolve(true));
        });
        return true;
    } catch (e: any) {
        console.error(`Failed to download ${key}:`, e.message);
        return false;
    }
};

// Helper to convert JSON cookies to Netscape format (required by yt-dlp)
const jsonToNetscape = (jsonCookies: any[]) => {
    let output = "# Netscape HTTP Cookie File\n";
    jsonCookies.forEach(c => {
        const domain = c.domain.startsWith('.') ? c.domain : '.' + c.domain;
        const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const path = c.path || '/';
        const secure = c.secure ? 'TRUE' : 'FALSE';
        const expiration = c.expirationDate ? Math.floor(c.expirationDate) : (Math.floor(Date.now() / 1000) + 31536000);
        output += `${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expiration}\t${c.name}\t${c.value}\n`;
    });
    return output;
};

export const handler: any = async (event: any) => {
    const { youtubeId } = event.arguments;
    const bucketName = process.env.MUSIC_DRIVE_BUCKET_NAME;

    if (!bucketName) throw new Error('MUSIC_DRIVE_BUCKET_NAME is not set');

    const YTDL_PATH = '/tmp/yt-dlp';
    const COOKIES_JSON_PATH = '/tmp/cookies.json';
    const COOKIES_TXT_PATH = '/tmp/cookies.txt';

    try {
        process.chdir('/tmp');

        // 1. Download yt-dlp binary if not present
        if (!fs.existsSync(YTDL_PATH)) {
            console.log('Downloading yt-dlp binary from S3...');
            const success = await downloadS3File(bucketName, 'bin/yt-dlp', YTDL_PATH);
            if (!success) throw new Error('Could not download bin/yt-dlp from S3');
            chmodSync(YTDL_PATH, '755');
        }

        // 2. Download and Convert Cookies
        if (!fs.existsSync(COOKIES_TXT_PATH)) {
            console.log('Fetching cookies.json from S3...');
            const cookieSuccess = await downloadS3File(bucketName, 'config/cookies.json', COOKIES_JSON_PATH);
            if (cookieSuccess) {
                try {
                    const jsonContent = fs.readFileSync(COOKIES_JSON_PATH, 'utf-8');
                    const cookies = JSON.parse(jsonContent);
                    const netscapeContent = jsonToNetscape(cookies);
                    fs.writeFileSync(COOKIES_TXT_PATH, netscapeContent);
                    console.log('Converted cookies to Netscape format.');
                } catch (e) {
                    console.warn('Cookie conversion failed:', e);
                }
            }
        }

        const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        const s3Key = `tracks/${youtubeId}.mp3`;
        const passThrough = new PassThrough();

        console.log(`Starting Upload to ${s3Key}`);
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucketName,
                Key: s3Key,
                Body: passThrough,
                ContentType: 'audio/mpeg',
            },
        });

        // 3. Spawn yt-dlp
        const args = [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '5', // Decent quality, small size
            '-o', '-', // Pipe to stdout
            videoUrl
        ];

        if (fs.existsSync(COOKIES_TXT_PATH)) {
            args.unshift('--cookies', COOKIES_TXT_PATH);
            console.log('Using cookies options');
        }

        console.log(`Spawning yt-dlp with args: ${args.join(' ')}`);
        const child = spawn(YTDL_PATH, args);

        child.stdout.pipe(passThrough);

        child.stderr.on('data', (data: any) => console.log(`[yt-dlp]: ${data}`));

        await new Promise((resolve, reject) => {
            child.on('close', (code: number) => {
                if (code === 0) resolve(true);
                else reject(new Error(`yt-dlp exited with code ${code}`));
            });
            child.on('error', reject);
        });

        await upload.done();
        console.log('Upload complete');

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
