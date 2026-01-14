import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { youtubeSearch } from './functions/youtube-search/resource';
import { songDownload } from './functions/song-download/resource';
// Temporarily removing 'auth' from the automatic backend definition 
// to see if it resolves the AppSync naming/configuration conflict.
// The Identity Pool for guest storage still exists in AWS and can be managed manually.

defineBackend({
  data,
  storage,
  youtubeSearch,
  songDownload
});
