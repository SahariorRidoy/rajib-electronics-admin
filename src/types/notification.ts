export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface NotificationResponse {
  ok: boolean;
  data: {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
}