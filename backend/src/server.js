require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URI,
  credentials: true
}));

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

// Routes
app.get('/', (req, res) => {
  res.send('Music Swiper API is running');
});

// Authentication Routes
app.get('/api/auth/login', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'user-library-modify',
    'user-library-read',
    'streaming',
    'user-read-playback-state'
  ];
  
  const state = generateRandomString(16);
  res.cookie('spotify_auth_state', state);
  
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
});

app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies ? req.cookies.spotify_auth_state : null;
  
  if (state === null || state !== storedState) {
    res.redirect(`${process.env.FRONTEND_URI}/error?message=state_mismatch`);
    return;
  }
  
  res.clearCookie('spotify_auth_state');
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;
    
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URI}/callback?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);
  } catch (error) {
    console.error('Error during callback:', error);
    res.redirect(`${process.env.FRONTEND_URI}/error?message=invalid_token`);
  }
});

app.get('/api/auth/refresh_token', async (req, res) => {
  const { refresh_token } = req.query;
  
  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }
  
  spotifyApi.setRefreshToken(refresh_token);
  
  try {
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    
    res.json({
      access_token,
      expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Track Endpoints
app.get('/api/tracks/recommendations', async (req, res) => {
  const { limit = 10, seed_genres, seed_artists, seed_tracks } = req.query;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  spotifyApi.setAccessToken(token);
  
  try {
    const options = { limit: parseInt(limit) };
    
    if (seed_genres) options.seed_genres = seed_genres.split(',');
    if (seed_artists) options.seed_artists = seed_artists.split(',');
    if (seed_tracks) options.seed_tracks = seed_tracks.split(',');
    
    const data = await spotifyApi.getRecommendations(options);
    
    const tracks = data.body.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      preview_url: track.preview_url,
      image_url: track.album.images[0]?.url
    }));
    
    res.json({ tracks });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.post('/api/tracks/like', async (req, res) => {
  const { track_id } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  if (!track_id) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameter: track_id' });
  }
  
  spotifyApi.setAccessToken(token);
  
  try {
    // Check if user has a "Music Swiper Likes" playlist
    const playlists = await spotifyApi.getUserPlaylists();
    let likedPlaylist = playlists.body.items.find(playlist => playlist.name === 'Music Swiper Likes');
    
    // If not, create one
    if (!likedPlaylist) {
      const newPlaylist = await spotifyApi.createPlaylist('Music Swiper Likes', { 
        description: 'Tracks you liked on Music Swiper',
        public: false
      });
      likedPlaylist = newPlaylist.body;
    }
    
    // Add track to playlist
    await spotifyApi.addTracksToPlaylist(likedPlaylist.id, [`spotify:track:${track_id}`]);
    
    res.json({
      success: true,
      message: 'Track added to playlist'
    });
  } catch (error) {
    console.error('Error liking track:', error);
    res.status(500).json({ error: 'Failed to like track' });
  }
});

app.post('/api/tracks/dislike', async (req, res) => {
  const { track_id } = req.body;
  
  if (!track_id) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameter: track_id' });
  }
  
  // For MVP, we're just acknowledging the dislike without storing it
  res.json({
    success: true,
    message: 'Track marked as disliked'
  });
});

// Playlist Endpoints
app.get('/api/playlists', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  spotifyApi.setAccessToken(token);
  
  try {
    const data = await spotifyApi.getUserPlaylists();
    
    const playlists = data.body.items.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      image_url: playlist.images[0]?.url,
      tracks_count: playlist.tracks.total
    }));
    
    res.json({ playlists });
  } catch (error) {
    console.error('Error getting playlists:', error);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

app.get('/api/playlists/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  spotifyApi.setAccessToken(token);
  
  try {
    const playlistData = await spotifyApi.getPlaylist(id);
    const tracksData = await spotifyApi.getPlaylistTracks(id);
    
    const playlist = {
      id: playlistData.body.id,
      name: playlistData.body.name,
      description: playlistData.body.description,
      image_url: playlistData.body.images[0]?.url,
      tracks: tracksData.body.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        preview_url: item.track.preview_url,
        image_url: item.track.album.images[0]?.url
      }))
    };
    
    res.json(playlist);
  } catch (error) {
    console.error('Error getting playlist:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

app.post('/api/playlists', async (req, res) => {
  const { name, description, public } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Bad Request', message: 'Missing required parameter: name' });
  }
  
  spotifyApi.setAccessToken(token);
  
  try {
    const data = await spotifyApi.createPlaylist(name, {
      description: description || '',
      public: public !== undefined ? public : false
    });
    
    res.json({
      id: data.body.id,
      name: data.body.name,
      description: data.body.description,
      public: data.body.public,
      image_url: data.body.images[0]?.url,
      tracks_count: 0
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// User Preferences Endpoints
// For MVP, we'll store preferences in memory
const userPreferences = {};

app.get('/api/preferences', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  // Get user ID from token (simplified for MVP)
  const userId = 'user_' + token.substring(0, 10);
  
  // Return preferences or default values
  res.json(userPreferences[userId] || {
    genres: ['pop', 'rock', 'indie'],
    artists: [],
    tracks: [],
    audio_features: {
      min_energy: 0.4,
      max_energy: 0.9,
      min_danceability: 0.3,
      max_danceability: 0.8
    }
  });
});

app.post('/api/preferences', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Access token is required' });
  }
  
  // Get user ID from token (simplified for MVP)
  const userId = 'user_' + token.substring(0, 10);
  
  // Update preferences
  userPreferences[userId] = {
    ...userPreferences[userId] || {},
    ...req.body
  };
  
  res.json({
    success: true,
    message: 'Preferences updated successfully'
  });
});

// Helper function to generate random string
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}

// Start server
app.listen(9000, () => {
  console.log(`Server is running on http://localhost:9000`);
});

module.exports = app;
