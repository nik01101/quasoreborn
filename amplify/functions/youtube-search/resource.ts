import { defineFunction, secret } from '@aws-amplify/backend';

export const youtubeSearch = defineFunction({
    name: 'youtube-search',
    entry: './handler.ts',
    environment: {
        YOUTUBE_API_KEY: secret('YOUTUBE_API_KEY')
    }
});
