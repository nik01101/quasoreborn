import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { Search as SearchIcon, Download, Loader2 } from 'lucide-react';

const client = generateClient<Schema>({ authMode: 'apiKey' });

export default function Search({ user }: { user: { username: string } }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const { data } = await client.queries.youtubeSearch({ query });
            setResults(data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (item: any) => {
        setDownloading(item.id);
        try {
            const { data } = await client.mutations.songDownload({
                youtubeId: item.id,
                title: item.title,
                artist: item.artist,
            });

            if (data?.success) {
                // Now save to DynamoDB for metadata
                await client.models.Track.create({
                    title: item.title,
                    artist: item.artist,
                    s3Key: data.s3Key!,
                    youtubeId: item.id,
                    owner: user.username,
                });
                alert('Downloaded and added to library!');
            } else {
                alert('Download failed: ' + data?.error);
            }
        } catch (err) {
            console.error('Download error:', err);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search for songs or artists..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                    />
                </div>
                <button type="submit">Search</button>
            </form>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {results.map((item) => (
                        <div key={item.id} className="glass" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {item.thumbnail ? (
                                <img src={item.thumbnail} alt={item.title} style={{ width: '100%', borderRadius: '8px', aspectRatio: '16/9', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', borderRadius: '8px', aspectRatio: '16/9', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span>No Image</span>
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.artist}</p>
                            </div>
                            <button
                                onClick={() => handleDownload(item)}
                                disabled={downloading === item.id}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: downloading === item.id ? 0.5 : 1 }}
                            >
                                {downloading === item.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
