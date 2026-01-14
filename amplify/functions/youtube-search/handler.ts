import { type Schema } from '../../data/resource';

export const handler: any = async (event: any) => {
    const { query } = event.arguments;
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        throw new Error('YOUTUBE_API_KEY is not set');
    }

    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            query
        )}&type=video&maxResults=10&key=${API_KEY}`
    );

    const data = await response.json();

    return (data.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url,
    }));
};
