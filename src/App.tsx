import { useState, useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import './index.css';

import Search from './components/Search';
import Library from './components/Library';
import Player from './components/AudioPlayer';

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'library' | 'playlists'>('search');
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(localStorage.getItem('quaso_user'));
  const [loginInput, setLoginInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      localStorage.setItem('quaso_user', loginInput.trim());
      setUsername(loginInput.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('quaso_user');
    setUsername(null);
  };

  if (!username) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="glass" style={{ padding: '3rem', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Quaso Música</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>Ingresa tu nombre de usuario para comenzar</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              style={{ textAlign: 'center', fontSize: '1.1rem' }}
              autoFocus
            />
            <button type="submit" style={{ padding: '1rem', fontSize: '1.1rem' }}>Iniciar Sesión / Crear Cuenta</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar glass">
        <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quaso Música</h1>
        <nav>
          <div
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span>🔍</span> Buscar
          </div>
          <div
            className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <span>📚</span> Biblioteca
          </div>
          <div
            className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            <span>🎵</span> Listas
          </div>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bienvenido, {username}</p>
          <button onClick={handleLogout} style={{ marginTop: '0.5rem', opacity: 0.7, padding: '0.5rem 1rem' }}>Cerrar Sesión</button>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'search' && <Search user={{ username }} />}
        {activeTab === 'library' && <Library onPlay={setCurrentTrack} user={{ username }} />}
        {activeTab === 'playlists' && <div>Listas de reproducción próximamente...</div>}
      </main>

      <footer className="player-bar glass">
        <Player currentTrack={currentTrack} />
      </footer>
    </div>
  );
}

export default App;
