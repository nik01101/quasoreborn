import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { youtubeSearch } from '../functions/youtube-search/resource';
import { songDownload } from '../functions/song-download/resource';

const schema = a.schema({
  Track: a.model({
    title: a.string().required(),
    artist: a.string().required(),
    album: a.string(),
    duration: a.integer(),
    s3Key: a.string().required(),
    youtubeId: a.string(),
    owner: a.string().required(),
    playlists: a.hasMany('PlaylistTrack', 'trackId'),
    favorites: a.hasMany('Favorite', 'trackId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  Playlist: a.model({
    name: a.string().required(),
    owner: a.string().required(),
    tracks: a.hasMany('PlaylistTrack', 'playlistId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  PlaylistTrack: a.model({
    playlistId: a.id().required(),
    trackId: a.id().required(),
    playlist: a.belongsTo('Playlist', 'playlistId'),
    track: a.belongsTo('Track', 'trackId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  Favorite: a.model({
    userId: a.string().required(),
    trackId: a.id().required(),
    track: a.belongsTo('Track', 'trackId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  YoutubeSearchResult: a.customType({
    id: a.string(),
    title: a.string(),
    artist: a.string(),
    thumbnail: a.string(),
  }),

  YoutubeDownloadResult: a.customType({
    success: a.boolean(),
    s3Key: a.string(),
    error: a.string(),
  }),

  youtubeSearch: a
    .query()
    .arguments({
      query: a.string().required(),
    })
    .returns(a.ref('YoutubeSearchResult').array())
    .handler(a.handler.function(youtubeSearch))
    .authorization((allow) => [allow.publicApiKey()]),

  songDownload: a
    .mutation()
    .arguments({
      youtubeId: a.string().required(),
      title: a.string().required(),
      artist: a.string().required(),
    })
    .returns(a.ref('YoutubeDownloadResult'))
    .handler(a.handler.function(songDownload))
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});
