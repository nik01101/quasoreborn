import { useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import './index.css';

import Search from './components/Search';
import Library from './components/Library';
import Player from './components/AudioPlayer';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'library' | 'playlists'>('search');
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app-container">
          <aside className="sidebar glass">
            <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quaso Music</h1>
            <nav>
              <div
                className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                <span>🔍</span> Search
              </div>
              <div
                className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
                onClick={() => setActiveTab('library')}
              >
                <span>📚</span> Library
              </div>
              <div
                className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setActiveTab('playlists')}
              >
                <span>🎵</span> Playlists
              </div>
            </nav>
            <div style={{ marginTop: 'auto' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Welcome, {user?.username}</p>
              <button onClick={signOut} style={{ marginTop: '0.5rem', opacity: 0.7 }}>Sign Out</button>
            </div>
          </aside>

          <main className="main-content">
            {activeTab === 'search' && <Search />}
            {activeTab === 'library' && <Library onPlay={setCurrentTrack} />}
            {activeTab === 'playlists' && <div>Playlists coming soon...</div>}
          </main>

          <footer className="player-bar glass">
            <Player currentTrack={currentTrack} />
          </footer>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
