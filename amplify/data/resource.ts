import { defineData, type ClientSchema } from '@aws-amplify/backend';
import { youtubeSearch } from '../functions/youtube-search/resource';
import { songDownload } from '../functions/song-download/resource';

const schema = defineData({
  schema: (s) => ({
    Track: s.model({
      title: s.string().required(),
      artist: s.string().required(),
      album: s.string(),
      duration: s.integer(),
      s3Key: s.string().required(),
      youtubeId: s.string(),
    }).authorization((allow) => [allow.authenticated()]),

    Playlist: s.model({
      name: s.string().required(),
      owner: s.string().required(),
      tracks: s.hasMany('PlaylistTrack', 'playlistId'),
    }).authorization((allow) => [allow.owner()]),

    PlaylistTrack: s.model({
      playlistId: s.id().required(),
      trackId: s.id().required(),
      playlist: s.belongsTo('Playlist', 'playlistId'),
      track: s.belongsTo('Track', 'trackId'),
    }).authorization((allow) => [allow.owner()]),

    Favorite: s.model({
      userId: s.string().required(),
      trackId: s.id().required(),
      track: s.belongsTo('Track', 'trackId'),
    }).authorization((allow) => [allow.owner()]),

    youtubeSearch: s
      .query()
      .arguments({
        query: s.string().required(),
      })
      .returns(
        s.customType({
          id: s.string(),
          title: s.string(),
          artist: s.string(),
          thumbnail: s.string(),
        }).array()
      )
      .handler(s.externalAuth({ function: youtubeSearch }))
      .authorization((allow) => [allow.authenticated()]),

    songDownload: s
      .mutation()
      .arguments({
        youtubeId: s.string().required(),
        title: s.string().required(),
        artist: s.string().required(),
      })
      .returns(
        s.customType({
          success: s.boolean(),
          s3Key: s.string(),
          error: s.string(),
        })
      )
      .handler(s.externalAuth({ function: songDownload }))
      .authorization((allow) => [allow.authenticated()]),
  }),
});

export type Schema = ClientSchema<typeof schema>;
export const data = schema;
