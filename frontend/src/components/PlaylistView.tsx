import { useState, useEffect } from 'react';
import { getPlaylists, getPlaylistDetails } from '../lib/spotify';
import { useAuth } from '../hooks/useAuth';

interface Playlist {
  id: string;
  name: string;
  image_url: string | null;
  tracks_count: number;
}

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  image_url: string;
}

const PlaylistView = () => {
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  // Fetch playlists when component mounts
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await getPlaylists();
        setPlaylists(response.playlists);
        
        // Auto-select "Music Swiper Likes" playlist if it exists
        const likedPlaylist = response.playlists.find((p: Playlist) => p.name === 'Music Swiper Likes');
        if (likedPlaylist) {
          setSelectedPlaylist(likedPlaylist.id);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [isAuthenticated]);

  // Fetch playlist tracks when selected playlist changes
  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      if (!selectedPlaylist) return;
      
      try {
        setLoading(true);
        const response = await getPlaylistDetails(selectedPlaylist);
        setPlaylistTracks(response.tracks);
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [selectedPlaylist]);

  // Handle audio playback
  const playPreview = (track: Track) => {
    // Stop current audio if playing
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.src = '';
    }
    
    // If clicking on currently playing track, stop it
    if (playingTrackId === track.id) {
      setPlayingTrackId(null);
      setAudioPlayer(null);
      return;
    }
    
    // Play new track if preview URL is available
    if (track.preview_url) {
      const audio = new Audio(track.preview_url);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      
      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
      });
      
      setAudioPlayer(audio);
      setPlayingTrackId(track.id);
    }
  };

  if (loading && playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading playlists...</p>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl mb-4">No playlists found</p>
          <p className="opacity-70">Start swiping to create your first playlist!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Playlists</h1>
      
      {/* Playlist Selection */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => setSelectedPlaylist(playlist.id)}
              className={`flex items-center p-3 rounded-lg transition-colors ${
                selectedPlaylist === playlist.id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {playlist.image_url && (
                <img 
                  src={playlist.image_url} 
                  alt={playlist.name} 
                  className="w-10 h-10 rounded mr-3 object-cover"
                />
              )}
              <div className="text-left">
                <div className="font-medium">{playlist.name}</div>
                <div className="text-sm opacity-70">{playlist.tracks_count} tracks</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Playlist Tracks */}
      {selectedPlaylist && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {playlists.find(p => p.id === selectedPlaylist)?.name}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading tracks...</p>
            </div>
          ) : playlistTracks.length === 0 ? (
            <div className="text-center py-8 opacity-70">
              <p>No tracks in this playlist yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {playlistTracks.map(track => (
                  <li key={track.id} className="hover:bg-gray-50">
                    <div className="flex items-center p-4">
                      {/* Track Image */}
                      <div className="relative flex-shrink-0">
                        <img 
                          src={track.image_url} 
                          alt={track.name} 
                          className="w-12 h-12 rounded object-cover"
                        />
                        
                        {/* Play Button Overlay */}
                        <button
                          onClick={() => playPreview(track)}
                          className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded hover:bg-black/50 transition-colors ${
                            !track.preview_url ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!track.preview_url}
                        >
                          {playingTrackId === track.id ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="6" y="4" width="4" height="16"></rect>
                              <rect x="14" y="4" width="4" height="16"></rect>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Track Info */}
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{track.name}</p>
                        <p className="text-sm text-gray-500 truncate">{track.artist}</p>
                      </div>
                      
                      {/* Album Name */}
                      <div className="hidden md:block text-sm text-gray-500 truncate ml-4 mr-6">
                        {track.album}
                      </div>
                      
                      {/* Preview Availability */}
                      <div className="ml-4 flex-shrink-0">
                        {track.preview_url ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Preview
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistView;
