// Spotify API utilities

const AUTH_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/auth/login`;
const RECOMMENDATIONS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/tracks/recommendations`;
const LIKE_TRACK_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/tracks/like`;
const DISLIKE_TRACK_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/tracks/dislike`;
const PLAYLISTS_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/playlists`;
const PREFERENCES_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/preferences`;
const REFRESH_TOKEN_ENDPOINT = `${import.meta.env.VITE_API_URL}/api/auth/refresh_token`;

// Get login URL
export const getLoginUrl = (): string => {
  return AUTH_ENDPOINT;
};

// Get tokens from URL after Spotify auth callback
export const getTokensFromUrl = (): { 
  access_token: string | null; 
  refresh_token: string | null;
  expires_in: number | null;
} => {
  const params = new URLSearchParams(window.location.search);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    expires_in: params.get('expires_in') ? parseInt(params.get('expires_in') as string) : null
  };
};

// Store tokens in localStorage
export const storeTokens = (
  accessToken: string, 
  refreshToken: string, 
  expiresIn: number
): void => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('token_expiry', (Date.now() + expiresIn * 1000).toString());
};

// Get stored tokens
export const getStoredTokens = (): { 
  accessToken: string | null; 
  refreshToken: string | null;
  tokenExpiry: number | null;
} => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    tokenExpiry: localStorage.getItem('token_expiry') 
      ? parseInt(localStorage.getItem('token_expiry') as string) 
      : null
  };
};

// Clear stored tokens (logout)
export const clearTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expiry');
};

// Check if token is expired
export const isTokenExpired = (): boolean => {
  const { tokenExpiry } = getStoredTokens();
  if (!tokenExpiry) return true;
  return Date.now() > tokenExpiry;
};

// Refresh access token
export const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;
  
  try {
    const response = await fetch(`${REFRESH_TOKEN_ENDPOINT}?refresh_token=${refreshToken}`);
    const data = await response.json();
    
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_expiry', (Date.now() + data.expires_in * 1000).toString());
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Get valid access token (refreshes if needed)
export const getValidToken = async (): Promise<string | null> => {
  const { accessToken } = getStoredTokens();
  
  if (!accessToken) return null;
  
  if (isTokenExpired()) {
    return await refreshAccessToken();
  }
  
  return accessToken;
};

// API request with authentication
const authenticatedRequest = async (
  url: string, 
  method: string = 'GET', 
  body: any = null
): Promise<any> => {
  const token = await getValidToken();
  
  if (!token) {
    throw new Error('No valid token available');
  }
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  const options: RequestInit = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return await response.json();
};

// Get track recommendations
export const getRecommendations = async (
  limit: number = 10,
  seedGenres?: string[],
  seedArtists?: string[],
  seedTracks?: string[]
): Promise<any> => {
  let url = `${RECOMMENDATIONS_ENDPOINT}?limit=${limit}`;
  
  if (seedGenres && seedGenres.length > 0) {
    url += `&seed_genres=${seedGenres.join(',')}`;
  }
  
  if (seedArtists && seedArtists.length > 0) {
    url += `&seed_artists=${seedArtists.join(',')}`;
  }
  
  if (seedTracks && seedTracks.length > 0) {
    url += `&seed_tracks=${seedTracks.join(',')}`;
  }
  
  return authenticatedRequest(url);
};

// Like a track
export const likeTrack = async (trackId: string): Promise<any> => {
  return authenticatedRequest(LIKE_TRACK_ENDPOINT, 'POST', { track_id: trackId });
};

// Dislike a track
export const dislikeTrack = async (trackId: string): Promise<any> => {
  return authenticatedRequest(DISLIKE_TRACK_ENDPOINT, 'POST', { track_id: trackId });
};

// Get user playlists
export const getPlaylists = async (): Promise<any> => {
  return authenticatedRequest(PLAYLISTS_ENDPOINT);
};

// Get playlist details
export const getPlaylistDetails = async (playlistId: string): Promise<any> => {
  return authenticatedRequest(`${PLAYLISTS_ENDPOINT}/${playlistId}`);
};

// Create a new playlist
export const createPlaylist = async (
  name: string, 
  description?: string, 
  isPublic: boolean = false
): Promise<any> => {
  return authenticatedRequest(PLAYLISTS_ENDPOINT, 'POST', {
    name,
    description,
    public: isPublic
  });
};

// Get user preferences
export const getUserPreferences = async (): Promise<any> => {
  return authenticatedRequest(PREFERENCES_ENDPOINT);
};

// Update user preferences
export const updateUserPreferences = async (preferences: any): Promise<any> => {
  return authenticatedRequest(PREFERENCES_ENDPOINT, 'POST', preferences);
};
