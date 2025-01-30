import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { env } from '../config/env';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  type: 'mention';
  draftId: string;
  commentId: string;
  mentionedBy: {
    id: string;
    name: string;
  };
}

class NotificationService {
  private async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mentions', {
        name: 'Mentions',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    return true;
  }

  async registerForPushNotifications() {
    const permissionGranted = await this.requestPermissions();
    if (!permissionGranted) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: env.EXPO_PROJECT_ID,
    });

    return token.data;
  }

  async sendMentionNotification(
    token: string,
    draftId: string,
    commentId: string,
    mentionedUserId: string,
    mentionedByUser: { id: string; name: string }
  ) {
    try {
      const response = await fetch(`${env.API_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: mentionedUserId,
          title: 'New Mention',
          body: `${mentionedByUser.name} mentioned you in a comment`,
          data: {
            type: 'mention',
            draftId,
            commentId,
            mentionedBy: mentionedByUser,
          } as NotificationData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as NotificationData;
    
    if (data.type === 'mention') {
      // Navigate to the specific draft and comment
      // This will be handled by the navigation service
      return {
        type: 'mention',
        draftId: data.draftId,
        commentId: data.commentId,
      };
    }
  }
}

export const notificationService = new NotificationService(); 