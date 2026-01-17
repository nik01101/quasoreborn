import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { youtubeSearch } from './functions/youtube-search/resource';
import { songDownload } from './functions/song-download/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  youtubeSearch,
  songDownload
});

// Inject the storage bucket name into the song-download Lambda function
// @ts-ignore
backend.songDownload.resources.lambda.addEnvironment(
  'MUSIC_DRIVE_BUCKET_NAME',
  backend.storage.resources.bucket.bucketName
);

// Grant the Lambda function permissions to read and write to the S3 bucket
// @ts-ignore
backend.storage.resources.bucket.grantReadWrite(backend.songDownload.resources.lambda);
