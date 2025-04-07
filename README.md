# Music Swiper - Tinder for Music

Music Swiper is a web-based music discovery application with a Tinder-like swipe interface. Users can discover new music tracks by swiping right to save to a personal playlist or swiping left to skip.

## Repository Structure

This repository contains both the frontend and backend components of the Music Swiper application:

- `/frontend` - React application with swipe interface
- `/backend` - Express server with Spotify API integration

## Features

- Swipe-based interface for music discovery
- Spotify integration for music playback and playlist management
- 30-second track previews
- Login via Spotify OAuth
- Save liked songs to a dedicated Spotify playlist
- Responsive design for both mobile and desktop

## Deployment

### Frontend Deployment (Vercel)

The frontend is configured for deployment to Vercel:

1. Import this repository to Vercel
2. Set the following environment variables:
   - `VITE_API_URL`: URL of your deployed backend
   - `VITE_CLIENT_ID`: Your Spotify Client ID
3. Deploy the frontend

### Backend Deployment (Render)

The backend is configured for deployment to Render:

1. Create a new Web Service on Render
2. Connect this repository
3. Set the build command to `npm install`
4. Set the start command to `npm start`
5. Add the following environment variables:
   - `CLIENT_ID`: Your Spotify Client ID
   - `CLIENT_SECRET`: Your Spotify Client Secret
   - `REDIRECT_URI`: `https://your-backend-url.onrender.com/api/auth/callback`
   - `FRONTEND_URI`: `https://your-frontend-url.vercel.app`
   - `PORT`: `10000`
6. Deploy the backend

### Spotify Configuration

After deployment, update your Spotify Developer Dashboard with the production redirect URIs:

1. `https://your-backend-url.onrender.com/api/auth/callback`
2. `https://your-frontend-url.vercel.app/callback`

## Local Development

See the individual README files in the frontend and backend directories for local development instructions.

## Tech Stack

- **Frontend**: React, Framer Motion, Tailwind CSS
- **Backend**: Node.js, Express
- **Authentication**: Spotify OAuth
- **API**: Spotify Web API

## License

MIT
