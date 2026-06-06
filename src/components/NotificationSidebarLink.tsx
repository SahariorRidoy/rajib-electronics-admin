"use client";

import { Bell } from 'lucide-react';
import { useGetNotificationsQuery } from '@/services/notifications.api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

interface NotificationSidebarLinkProps {
  isCollapsed?: boolean;
}

export default function NotificationSidebarLink({ isCollapsed }: NotificationSidebarLinkProps) {
  const pathname = usePathname();
  const { data } = useGetNotificationsQuery({ page: 1, unread: true });
  const unreadCount = data?.data?.unreadCount || 0;
  const isActive = pathname === '/notifications';

  return (
    <Link
      href="/notifications"
      title={isCollapsed ? "Notifications" : ""}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative",
        isActive
          ? "bg-[#167389] text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100",
        isCollapsed && "justify-center"
      )}
    >
      <div className="relative">
        <Bell className="w-5 h-5 flex-shrink-0" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium text-[10px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}