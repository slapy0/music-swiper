import { useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { getRecommendations, likeTrack, dislikeTrack } from '../lib/spotify';
import { useAuth } from '../hooks/useAuth';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  image_url: string;
}

const SwipeInterface = () => {
  const { isAuthenticated, getToken } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch recommendations when component mounts
  useEffect(() => {
    const fetchTracks = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await getRecommendations(10, ['pop', 'rock', 'indie']);
        setTracks(response.tracks);
        if (response.tracks.length > 0) {
          setCurrentTrack(response.tracks[0]);
        }
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [isAuthenticated]);

  // Set up audio player when current track changes
  useEffect(() => {
    if (currentTrack?.preview_url) {
      const audio = new Audio(currentTrack.preview_url);
      setAudioPlayer(audio);
      
      // Auto-play when track changes
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
      
      return () => {
        audio.pause();
        audio.src = '';
      };
    } else {
      setAudioPlayer(null);
      setIsPlaying(false);
    }
  }, [currentTrack]);

  // Handle end of track
  useEffect(() => {
    if (audioPlayer) {
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      audioPlayer.addEventListener('ended', handleEnded);
      
      return () => {
        audioPlayer.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioPlayer]);

  // Toggle play/pause
  const togglePlay = () => {
    if (audioPlayer) {
      if (isPlaying) {
        audioPlayer.pause();
      } else {
        audioPlayer.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle swipe
  const handleDragEnd = async (info: PanInfo) => {
    if (!currentTrack) return;
    
    const threshold = 100; // minimum distance for a swipe
    const direction = info.offset.x > 0 ? 'right' : 'left';
    
    if (Math.abs(info.offset.x) < threshold) {
      return; // not a significant swipe
    }
    
    try {
      if (direction === 'right') {
        // Like track
        await likeTrack(currentTrack.id);
        console.log('Liked track:', currentTrack.name);
      } else {
        // Dislike track
        await dislikeTrack(currentTrack.id);
        console.log('Disliked track:', currentTrack.name);
      }
      
      // Move to next track
      const nextTrack = tracks.length > 1 ? tracks[1] : null;
      setTracks(tracks.slice(1));
      setCurrentTrack(nextTrack);
      
      // Fetch more tracks if running low
      if (tracks.length < 3) {
        const response = await getRecommendations(5, ['pop', 'rock', 'indie']);
        setTracks(prevTracks => [...prevTracks, ...response.tracks]);
      }
    } catch (error) {
      console.error('Error handling swipe:', error);
    }
  };

  // Handle button click (alternative to swipe)
  const handleButtonClick = async (like: boolean) => {
    if (!currentTrack) return;
    
    try {
      if (like) {
        await likeTrack(currentTrack.id);
        console.log('Liked track:', currentTrack.name);
      } else {
        await dislikeTrack(currentTrack.id);
        console.log('Disliked track:', currentTrack.name);
      }
      
      // Move to next track
      const nextTrack = tracks.length > 1 ? tracks[1] : null;
      setTracks(tracks.slice(1));
      setCurrentTrack(nextTrack);
      
      // Fetch more tracks if running low
      if (tracks.length < 3) {
        const response = await getRecommendations(5, ['pop', 'rock', 'indie']);
        setTracks(prevTracks => [...prevTracks, ...response.tracks]);
      }
    } catch (error) {
      console.error('Error handling button click:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading tracks...</p>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl mb-4">No more tracks to discover</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={async () => {
              try {
                setLoading(true);
                const response = await getRecommendations(10, ['pop', 'rock', 'indie']);
                setTracks(response.tracks);
                if (response.tracks.length > 0) {
                  setCurrentTrack(response.tracks[0]);
                }
              } catch (error) {
                console.error('Error fetching tracks:', error);
              } finally {
                setLoading(false);
              }
            }}
          >
            Get More Tracks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-md">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => handleDragEnd(info)}
          whileDrag={{ scale: 1.05 }}
          className="relative bg-white rounded-lg shadow-xl overflow-hidden"
          style={{ aspectRatio: '1/1' }}
        >
          {/* Track Image */}
          <img 
            src={currentTrack.image_url} 
            alt={`${currentTrack.name} by ${currentTrack.artist}`}
            className="w-full h-full object-cover"
          />
          
          {/* Track Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
            <h2 className="text-xl font-bold truncate">{currentTrack.name}</h2>
            <p className="truncate">{currentTrack.artist}</p>
            <p className="text-sm opacity-80 truncate">{currentTrack.album}</p>
          </div>
          
          {/* Play/Pause Button */}
          {currentTrack.preview_url && (
            <button 
              onClick={togglePlay}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/30 transition-colors"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          )}
          
          {/* Swipe Instructions */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-500/80 text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </div>
          
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-green-500/80 text-white p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </motion.div>
        
        {/* Swipe Buttons (alternative to swiping) */}
        <div className="flex justify-center mt-6 space-x-8">
          <button 
            onClick={() => handleButtonClick(false)}
            className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <button 
            onClick={() => handleButtonClick(true)}
            className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        </div>
        
        {/* Track Progress */}
        <div className="mt-6 text-center text-sm opacity-70">
          Track {tracks.length > 0 ? tracks.length : 0} remaining
        </div>
      </div>
    </div>
  );
};

export default SwipeInterface;
