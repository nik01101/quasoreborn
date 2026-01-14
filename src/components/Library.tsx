import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { Play, Search as SearchIcon } from 'lucide-react';

const client = generateClient<Schema>({ authMode: 'apiKey' });

interface LibraryProps {
    onPlay: (track: any) => void;
    user: { username: string };
}

export default function Library({ onPlay, user }: LibraryProps) {
    const [tracks, setTracks] = useState<any[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Filter by owner to show only this user's tracks
        const sub = client.models.Track.observeQuery({
            filter: {
                owner: {
                    eq: user.username
                }
            }
        }).subscribe({
            next: ({ items }: { items: any[] }) => {
                setTracks(items);
                setFilteredTracks(items);
            },
            error: (err) => console.error('Library subscription error:', err)
        });
        return () => sub.unsubscribe();
    }, [user.username]);

    useEffect(() => {
        const filtered = tracks.filter((track) => {
            const match = (track.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (track.artist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (track.album || '').toLowerCase().includes(searchTerm.toLowerCase());
            return match;
        });
        setFilteredTracks(filtered);
    }, [searchTerm, tracks]);

    return (
        <div className="library-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 className="gradient-text">Your Library</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <SearchIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Filter library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                        />
                    </div>
                </div>
            </div>

            {filteredTracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                    <p>No songs in your library yet. Search and download some!</p>
                </div>
            ) : (
                <div className="tracks-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredTracks.map((track) => (
                        <div
                            key={track.id}
                            className="glass"
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => onPlay(track)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                <div className="play-icon" style={{ color: 'var(--primary)' }}>
                                    <Play size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem' }}>{track.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{track.artist} {track.album ? `• ${track.album}` : ''}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
