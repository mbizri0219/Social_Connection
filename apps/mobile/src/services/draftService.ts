import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../config/env';

const DRAFT_STORAGE_KEY = '@drafts:autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

interface AutosaveDraft {
  id?: string;
  content: string;
  platform: string;
  mediaUrls?: string[];
  lastModified: string;
  scheduledFor?: string;
}

export const draftService = {
  async saveAutoSaveDraft(draft: AutosaveDraft): Promise<void> {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${draft.platform}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...draft,
        lastModified: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving auto-save draft:', error);
    }
  },

  async getAutoSaveDraft(platform: string): Promise<AutosaveDraft | null> {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${platform}`;
      const draft = await AsyncStorage.getItem(key);
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error('Error getting auto-save draft:', error);
      return null;
    }
  },

  async clearAutoSaveDraft(platform: string): Promise<void> {
    try {
      const key = `${DRAFT_STORAGE_KEY}:${platform}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing auto-save draft:', error);
    }
  },

  async saveDraftToServer(draft: AutosaveDraft, token: string): Promise<string | null> {
    try {
      const response = await fetch(`${env.API_URL}/posts/drafts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft to server');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error saving draft to server:', error);
      return null;
    }
  },

  async updateDraftOnServer(draftId: string, draft: AutosaveDraft, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${env.API_URL}/posts/drafts/${draftId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error('Failed to update draft on server');
      }

      return true;
    } catch (error) {
      console.error('Error updating draft on server:', error);
      return false;
    }
  },

  createAutoSaveInterval(callback: () => void): ReturnType<typeof setInterval> {
    return setInterval(callback, AUTOSAVE_INTERVAL);
  },

  clearAutoSaveInterval(interval: ReturnType<typeof setInterval>): void {
    clearInterval(interval);
  },
}; 