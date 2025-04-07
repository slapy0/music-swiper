# GitHub Repository and Deployment Guide

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account (or create one if you don't have it)
2. Click on the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., "music-swiper")
4. Add a description (optional)
5. Choose visibility (public or private)
6. Click "Create repository"

## Step 2: Upload Your Code to GitHub

### Option 1: Using GitHub Desktop
1. Download and install [GitHub Desktop](https://desktop.github.com/)
2. Clone your new repository to your local machine
3. Copy all files from the `music-swiper-github` folder to your local repository folder
4. Commit the changes with a message like "Initial commit"
5. Push the changes to GitHub

### Option 2: Using Git Command Line
1. Download the `music-swiper-github` folder to your local machine
2. Open a terminal and navigate to the downloaded folder
3. Run the following commands:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/music-swiper.git
   git push -u origin main
   ```

## Step 3: Deploy the Backend to Render

1. Go to [Render](https://render.com) and sign up/sign in
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: music-swiper-backend
   - Root Directory: backend
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start
5. Add the following environment variables:
   - CLIENT_ID: Your Spotify Client ID (84faf2fd52ed45599418fa0716809479)
   - CLIENT_SECRET: Your Spotify Client Secret (d9c6e755349245638bada66646fa20e6)
   - REDIRECT_URI: (leave blank for now, will update after deployment)
   - FRONTEND_URI: (leave blank for now, will update after deployment)
   - PORT: 10000
6. Click "Create Web Service"
7. Wait for the deployment to complete and note the URL (e.g., https://music-swiper-backend.onrender.com)

## Step 4: Deploy the Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/sign in
2. Click "Add New" and select "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build (or pnpm run build)
   - Output Directory: dist
5. Add the following environment variables:
   - VITE_API_URL: Your backend URL from Step 3 (e.g., https://music-swiper-backend.onrender.com)
   - VITE_CLIENT_ID: Your Spotify Client ID (84faf2fd52ed45599418fa0716809479)
6. Click "Deploy"
7. Wait for the deployment to complete and note the URL (e.g., https://music-swiper.vercel.app)

## Step 5: Update Environment Variables

1. Go back to your Render dashboard and update the backend environment variables:
   - REDIRECT_URI: Your backend URL + "/api/auth/callback" (e.g., https://music-swiper-backend.onrender.com/api/auth/callback)
   - FRONTEND_URI: Your frontend URL (e.g., https://music-swiper.vercel.app)
2. Save changes and wait for the backend to redeploy

## Step 6: Update Spotify Developer Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your Music Swiper application
3. Click "Edit Settings"
4. Add the following Redirect URIs:
   - Your backend callback URL (e.g., https://music-swiper-backend.onrender.com/api/auth/callback)
   - Your frontend callback URL (e.g., https://music-swiper.vercel.app/callback)
5. Save changes

## Step 7: Test Your Deployed Application

1. Visit your frontend URL (e.g., https://music-swiper.vercel.app)
2. Test the Spotify login functionality
3. Verify that you can browse and swipe through music recommendations
4. Check that liked tracks are saved to your Spotify playlist

Congratulations! Your Music Swiper application is now permanently deployed and accessible from anywhere.
