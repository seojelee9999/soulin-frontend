import client from './client';
import type { NotificationItem, UnreadCountResponse } from '../types';

// GET /notifications — 최신순 최대 50
export const fetchNotifications = (): Promise<NotificationItem[]> =>
  client.get<NotificationItem[]>('/notifications').then((r) => r.data);

// GET /notifications/unread-count
export const fetchUnreadCount = (): Promise<number> =>
  client.get<UnreadCountResponse>('/notifications/unread-count').then((r) => r.data.unreadCount);

// PATCH /notifications/{id}/read — 204
export const markNotificationRead = (notificationId: number): Promise<void> =>
  client.patch(`/notifications/${notificationId}/read`).then(() => undefined);

// PATCH /notifications/read-all — 204
export const markAllNotificationsRead = (): Promise<void> =>
  client.patch('/notifications/read-all').then(() => undefined);
