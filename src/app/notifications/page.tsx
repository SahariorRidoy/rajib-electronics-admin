"use client";

import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAsUnreadMutation, useMarkAllAsReadMutation, useClearReadNotificationsMutation } from '@/services/notifications.api';
import { Notification } from '@/types/notification';

export default function NotificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'ORDER' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('all');
  
  const { data, isLoading, refetch } = useGetNotificationsQuery({ 
    page: currentPage, 
    unread: showUnreadOnly 
  });
  
  const [markAsRead] = useMarkAsReadMutation();
  const [markAsUnread] = useMarkAsUnreadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [clearRead] = useClearReadNotificationsMutation();

  const allNotifications = data?.data?.notifications || [];
  const notifications = activeTab === 'all' 
    ? allNotifications 
    : activeTab === 'LOW_STOCK' || activeTab === 'OUT_OF_STOCK'
    ? allNotifications.filter(n => n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK')
    : allNotifications.filter(n => n.type === activeTab);
  
  const orderCount = allNotifications.filter(n => n.type === 'ORDER').length;
  const stockCount = allNotifications.filter(n => n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK').length;
  const unreadCount = data?.data?.unreadCount || 0;
  const totalPages = data?.data?.totalPages || 1;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    refetch();
  };

  const handleMarkAsUnread = async (id: string) => {
    await markAsUnread(id);
    refetch();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    refetch();
  };

  const handleClearRead = async () => {
    await clearRead();
    refetch();
    setShowClearModal(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 lg:pt-0">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#167389]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">{unreadCount} unread notifications</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                All ({allNotifications.length})
              </button>
              <button
                onClick={() => setActiveTab('ORDER')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'ORDER' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Orders ({orderCount})
              </button>
              <button
                onClick={() => setActiveTab('LOW_STOCK')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'LOW_STOCK' || activeTab === 'OUT_OF_STOCK' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Stock Alerts ({stockCount})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                showUnreadOnly 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{showUnreadOnly ? 'Unread Only' : 'All Notifications'}</span>
              <span className="sm:hidden">{showUnreadOnly ? 'Unread' : 'All Notifications'}</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-200 transition-all text-xs sm:text-sm"
              >
                <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">Mark All Read</span>
              </button>
            )}
            
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-200 transition-all text-xs sm:text-sm"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Clear Read</span>
              <span className="sm:hidden">Clear Read</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {showUnreadOnly ? 'No unread notifications' : activeTab === 'all' ? 'You\'re all caught up!' : `No ${activeTab} notifications`}
              </p>
            </div>
          ) : (
            notifications.map((notification: Notification) => (
              <div
                key={notification._id}
                className={`p-3 sm:p-4 rounded-lg border transition-all ${
                  !notification.isRead 
                    ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{notification.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        notification.type === 'ORDER' 
                          ? 'bg-green-100 text-green-700' 
                          : notification.type === 'LOW_STOCK'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {notification.type === 'ORDER' ? 'Order' : notification.type === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2 text-sm sm:text-base">{notification.message}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{formatTime(notification.createdAt)}</p>
                  </div>
                  
                  <div className="flex items-center justify-end sm:justify-start">
                    {notification.isRead ? (
                      <button
                        onClick={() => handleMarkAsUnread(notification._id)}
                        className="px-2 sm:px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        Mark as Unread
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="px-2 sm:px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800">Clear Read Notifications</h3>
              <p className="text-sm text-gray-600 mt-1">This will permanently delete all read notifications. Continue?</p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={() => setShowClearModal(false)} 
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearRead} 
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}