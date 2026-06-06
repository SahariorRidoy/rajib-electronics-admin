"use client";

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useClearReadNotificationsMutation } from '@/services/notifications.api';
import { Notification } from '@/types/notification';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data, refetch } = useGetNotificationsQuery({ page: 1, unread: false });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [clearRead] = useClearReadNotificationsMutation();

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-all"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-20 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[70vh] overflow-hidden sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:inset-x-auto">
          <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs flex gap-1 text-blue-600 hover:text-blue-800"
                  title="Mark all as read"
                >Mark All Read
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowClearModal(true)}
                className="text-xs text-red-600 hover:text-red-800"
                title="Clear read notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 sm:max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification: Notification) => (
                <div
                  key={notification._id}
                  className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1 sm:mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.createdAt)}
                        </span>
                        <span className={`text-xs px-1.5 sm:px-2 py-1 rounded-full ${
                          notification.type === 'ORDER' 
                            ? 'bg-green-100 text-green-700' 
                            : notification.type === 'LOW_STOCK'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {notification.type === 'ORDER' ? 'Order' : notification.type === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 sm:p-3 border-t border-gray-200 text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-4 top-24 bottom-20 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center">
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