import { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';

interface PlayerProps {
    currentTrack: any;
}

export default function Player({ currentTrack }: PlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    useEffect(() => {
        if (currentTrack?.s3Key) {
            loadTrack(currentTrack.s3Key);
        }
    }, [currentTrack]);

    const loadTrack = async (key: string) => {
        try {
            const { url } = await getUrl({ path: key });
            setAudioUrl(url.toString());
            setIsPlaying(true);
        } catch (err) {
            console.error('Error fetching audio URL:', err);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '2rem' }}>
            <audio
                ref={audioRef}
                src={audioUrl || ''}
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={onTimeUpdate}
            />

            {/* Current Track Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '300px' }}>
                <div className="glass" style={{ width: '56px', height: '56px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={24} color="var(--text-secondary)" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack?.title || 'No track selected'}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentTrack?.artist || '-'}</p>
                </div>
            </div>

            {/* Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <SkipBack size={20} className="hover:text-primary cursor-pointer" />
                    <button
                        onClick={togglePlay}
                        style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
                    </button>
                    <SkipForward size={20} className="hover:text-primary cursor-pointer" />
                </div>
                <div style={{ width: '100%', maxWidth: '500px', height: '4px', background: 'var(--glass-border)', borderRadius: '2px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'var(--primary)', borderRadius: '2px' }} />
                </div>
            </div>

            {/* Volume */}
            <div style={{ width: '300px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                <Volume2 size={20} color="var(--text-secondary)" />
                <div style={{ width: '100px', height: '4px', background: 'var(--glass-border)', borderRadius: '2px' }}>
                    <div style={{ width: '70%', height: '100%', background: 'var(--text-secondary)', borderRadius: '2px' }} />
                </div>
            </div>
        </div>
    );
}
