import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  body?: any;
}

export const useFetch = () => {
  const { accessToken } = useAuth();

  const fetch = useCallback(
    async (path: string, options: FetchOptions = {}) => {
      const url = `${API_URL}${path}`;
      const headers = new Headers({
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      });

      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }

      const response = await window.fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'An error occurred');
      }

      return response;
    },
    [accessToken]
  );

  return fetch;
}; 