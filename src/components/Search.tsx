import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { Search as SearchIcon, Download, Loader2, Check, XCircle } from 'lucide-react';

export default function Search({ user }: { user: { username: string } }) {
    const client = generateClient<Schema>({ authMode: 'iam' });
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
    const [downloadStatus, setDownloadStatus] = useState<Record<string, 'success' | 'error'>>({});

    const handleSearch = async (e: React.FormEvent) => {
        // ... (existing search logic) ...
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const { data, errors } = await client.queries.youtubeSearch({ query });
            if (errors) {
                console.error('Search errors:', errors);
                return;
            }
            setResults(data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (item: any) => {
        setDownloadingIds(prev => new Set(prev).add(item.id));
        setDownloadStatus(prev => {
            const next = { ...prev };
            delete next[item.id]; // Reset status
            return next;
        });

        try {
            const { data, errors } = await client.mutations.songDownload({
                youtubeId: item.id,
                title: item.title,
                artist: item.artist
            });

            if (errors || !data?.success) {
                const errorMsg = errors ? JSON.stringify(errors) : data?.error;
                console.error('Download errors:', errorMsg);
                alert(`Download failed: ${errorMsg}`);
                setDownloadStatus(prev => ({ ...prev, [item.id]: 'error' }));
                return;
            }

            // Also create a Track record in the database for the library
            await client.models.Track.create({
                title: item.title,
                artist: item.artist,
                s3Key: data?.s3Key || '',
                youtubeId: item.id,
                owner: user.username
            });

            setDownloadStatus(prev => ({ ...prev, [item.id]: 'success' }));

        } catch (err) {
            console.error('Download error:', err);
            alert('Download failed due to a network or server error.');
            setDownloadStatus(prev => ({ ...prev, [item.id]: 'error' }));
        } finally {
            setDownloadingIds(prev => {
                const updated = new Set(prev);
                updated.delete(item.id);
                return updated;
            });
        }
    };

    return (
        <div className="search-container">
            {/* ... (render logic) ... */}
            <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>Descubrir Música</h2>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Buscar canciones o artistas..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ paddingLeft: '3rem' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ width: '120px' }}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Buscar'}
                </button>
            </form>

            <div className="results-grid" style={{
                marginTop: '3rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '2rem'
            }}>
                {results.map((item) => (
                    <div key={item.id} className="glass card animate-in" style={{ padding: '1rem' }}>
                        <div style={{ position: 'relative', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                            {item.thumbnail ? (
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(45deg, var(--bg-card), var(--bg-main))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.5
                                }}>
                                    <span style={{ fontSize: '0.8rem' }}>No Image</span>
                                </div>
                            )}
                            <button
                                className="download-btn"
                                onClick={() => handleDownload(item)}
                                disabled={downloadingIds.has(item.id) || downloadStatus[item.id] === 'success'}
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: downloadStatus[item.id] === 'success' ? '#22c55e' : (downloadStatus[item.id] === 'error' ? '#ef4444' : undefined)
                                }}
                            >
                                {downloadingIds.has(item.id) ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : downloadStatus[item.id] === 'success' ? (
                                    <Check size={20} />
                                ) : downloadStatus[item.id] === 'error' ? (
                                    <XCircle size={20} />
                                ) : (
                                    <Download size={20} />
                                )}
                            </button>
                        </div>
                        <h4 style={{
                            fontSize: '0.95rem',
                            marginBottom: '0.25rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }} title={item.title}>{item.title}</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.artist}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
