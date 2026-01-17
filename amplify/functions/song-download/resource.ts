import { defineFunction } from '@aws-amplify/backend';

export const songDownload = defineFunction({
    name: 'song-download',
    entry: './handler.ts',
    timeoutSeconds: 300,
    memoryMB: 1024
});
