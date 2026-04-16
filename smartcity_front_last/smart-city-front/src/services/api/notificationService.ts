import apiClient from './apiClient';
import { Notification, NotificationType } from '../../types/api.types';

export interface NotificationRequest {
    recipientId: string;
    type: NotificationType;
    message: string;
}

export const notificationService = {
    /**
     * Get notifications for a specific user
     */
    async getNotifications(recipientId: string): Promise<Notification[]> {
        const response = await apiClient.get<Notification[]>(`/api/notifications/${recipientId}`);
        return response.data;
    },

    /**
     * Send a notification (mostly for testing or specific use cases)
     */
    async sendNotification(request: NotificationRequest): Promise<void> {
        await apiClient.post('/api/notifications/send', request);
    }
};
