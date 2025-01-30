import { env } from '../config/env';
import { useAuth } from '../hooks/useAuth';

interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export const refreshOAuthToken = async (
  platform: string,
  refreshToken: string,
  authToken: string
): Promise<RefreshTokenResponse> => {
  try {
    const response = await fetch(`${env.API_URL}/auth/${platform}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to refresh token');
    }

    return response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to refresh token');
  }
};

export const isTokenExpired = (expiresAt: number): boolean => {
  // Add a 5-minute buffer to ensure we refresh before actual expiration
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + bufferTime >= expiresAt;
};

export const handleTokenRefresh = async (
  platform: string,
  refreshToken: string,
  authToken: string,
  onSuccess: (newTokens: RefreshTokenResponse) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const newTokens = await refreshOAuthToken(platform, refreshToken, authToken);
    onSuccess(newTokens);
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Failed to refresh token'));
  }
}; 