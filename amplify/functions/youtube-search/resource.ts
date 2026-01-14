import { defineFunction } from '@aws-amplify/backend';

export const youtubeSearch = defineFunction({
    name: 'youtube-search',
    entry: './handler.ts'
});
