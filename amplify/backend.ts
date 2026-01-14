import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { youtubeSearch } from './functions/youtube-search/resource';
import { songDownload } from './functions/song-download/resource';

defineBackend({
  auth,
  data,
  storage,
  youtubeSearch,
  songDownload
});
