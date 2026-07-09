export interface NotificationItem {
  notificationId: number;
  type: string; // 'POST_REACTION' 등
  postId: number;
  postTitle: string;
  actorId: number;
  actorName: string;
  reactionName: string;
  colorName: string;
  read: boolean;
  createdAt: string; // ISO8601
}

export interface UnreadCountResponse {
  unreadCount: number;
}
