import { env } from '../config/env';

export interface WebSocketMessage {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted' | 'collaborator_added' | 'collaborator_removed' | 'role_updated';
  draftId: string;
  data: any;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${env.WS_URL}/drafts?token=${token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(token);
    }, timeout);
  }

  subscribe(draftId: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(draftId)) {
      this.messageHandlers.set(draftId, new Set());
    }
    this.messageHandlers.get(draftId)?.add(handler);
  }

  unsubscribe(draftId: string, handler: MessageHandler) {
    this.messageHandlers.get(draftId)?.delete(handler);
    if (this.messageHandlers.get(draftId)?.size === 0) {
      this.messageHandlers.delete(draftId);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.draftId);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }
}

export const websocketService = new WebSocketService(); 