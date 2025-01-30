import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export type OAuthConfig = {
  platform: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  redirectUri?: string;
};

export type OAuthResult = {
  type: 'success' | 'error';
  params?: {
    code?: string;
    state?: string;
    error?: string;
  };
};

const generateState = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const initiateOAuth = async (config: OAuthConfig): Promise<OAuthResult> => {
  try {
    const redirectUri = config.redirectUri || makeRedirectUri({
      scheme: 'postiz',
      path: `auth/${config.platform}`,
    });

    const state = generateState();
    
    // Construct the authorization URL with all necessary parameters
    const authUrlWithParams = `${config.authUrl}?` + 
      `client_id=${encodeURIComponent(config.clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(config.scopes.join(' '))}` +
      `&response_type=code`;

    // Open the browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(
      authUrlWithParams,
      redirectUri,
      {
        showInRecents: true,
        createTask: false,
      }
    );

    if (result.type === 'success' && result.url) {
      const params = new URL(result.url).searchParams;
      const code = params.get('code');
      const returnedState = params.get('state');
      const error = params.get('error');

      if (error) {
        return {
          type: 'error',
          params: { error },
        };
      }

      if (returnedState !== state) {
        return {
          type: 'error',
          params: { error: 'State mismatch' },
        };
      }

      return {
        type: 'success',
        params: {
          code: code || undefined,
          state: returnedState,
        },
      };
    }

    return {
      type: 'error',
      params: {
        error: 'Authorization cancelled',
      },
    };
  } catch (error) {
    return {
      type: 'error',
      params: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}; 