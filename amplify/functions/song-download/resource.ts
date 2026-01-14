import { defineFunction } from '@aws-amplify/backend';

export const songDownload = defineFunction({
    name: 'song-download',
    entry: './handler.ts',
    timeoutSeconds: 300, // 5 minutes for download/process
    memoryMB: 1024
});
