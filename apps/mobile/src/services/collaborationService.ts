import { env } from '../config/env';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  picture: string | null;
  role: 'editor' | 'viewer';
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userPicture: string | null;
  createdAt: string;
  updatedAt: string | null;
  mentions: string[];
}

class CollaborationService {
  private baseUrl = env.API_URL;

  async getCollaborators(draftId: string, token: string): Promise<Collaborator[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/collaborators`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw error;
    }
  }

  async addCollaborator(
    draftId: string,
    email: string,
    role: 'editor' | 'viewer',
    token: string
  ): Promise<Collaborator> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/collaborators`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add collaborator');
      }

      return response.json();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  async removeCollaborator(
    draftId: string,
    collaboratorId: string,
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/collaborators/${collaboratorId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  async updateCollaboratorRole(
    draftId: string,
    collaboratorId: string,
    role: 'editor' | 'viewer',
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/collaborators/${collaboratorId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      throw error;
    }
  }

  async getComments(draftId: string, token: string): Promise<Comment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  async addComment(
    draftId: string,
    content: string,
    mentions: string[],
    token: string
  ): Promise<Comment> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content, mentions }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      return response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async updateComment(
    draftId: string,
    commentId: string,
    content: string,
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(
    draftId: string,
    commentId: string,
    token: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/drafts/${draftId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

export const collaborationService = new CollaborationService(); 