import React, { useState, useEffect, useRef } from 'react';
import { EnvironmentalNotification } from '../types';
import { BellIcon } from './icons/BellIcon';
import { motion, AnimatePresence } from 'motion/react';
import { safeFormatDistanceToNow } from '../utils/dateUtils';

interface NotificationCenterProps {
  notifications: EnvironmentalNotification[];
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onSelectReport: (reportId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onSelectReport
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: EnvironmentalNotification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onSelectReport(notification.reportId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Thông báo"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1100] overflow-hidden"
          >
            <div className="p-4 border-bottom border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={onMarkAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${!notification.isRead ? 'bg-emerald-50/30' : ''}`}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full" />
                      )}
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          notification.priority === 'Cao' ? 'bg-red-100 text-red-600' : 
                          notification.priority === 'Trung bình' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <BellIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                              {notification.area}
                            </span>
                            <span className="text-[10px] text-gray-400">•</span>
                            <span className="text-[10px] text-gray-400">
                              {safeFormatDistanceToNow(notification.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 text-center bg-gray-50/30">
              <button 
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
