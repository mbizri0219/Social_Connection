export const env = {
  API_URL: process.env.API_URL || 'http://localhost:3000',
  WS_URL: process.env.WS_URL || 'ws://localhost:3000',
  EXPO_PROJECT_ID: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
  
  // Twitter/X
  TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
  
  // Instagram
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  
  // LinkedIn
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  
  // Facebook
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  
  // YouTube
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET,
  
  // TikTok
  TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
  TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
  
  // Pinterest
  PINTEREST_CLIENT_ID: process.env.PINTEREST_CLIENT_ID,
  PINTEREST_CLIENT_SECRET: process.env.PINTEREST_CLIENT_SECRET,
  
  // Threads
  THREADS_CLIENT_ID: process.env.THREADS_CLIENT_ID,
  THREADS_CLIENT_SECRET: process.env.THREADS_CLIENT_SECRET,
} as const; 