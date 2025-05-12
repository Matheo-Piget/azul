import React, { useState, useEffect, createContext, useContext } from 'react';
import './NotificationSystem.css';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (type: NotificationType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, clearAll }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <NotificationToast 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

const NotificationToast: React.FC<{ 
  notification: Notification, 
  onClose: () => void 
}> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.duration !== Infinity) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onClose]);

  const icons = {
    error: '❌',
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
  };

  return (
    <div className={`notification-toast ${notification.type}`}>
      <div className="notification-icon">{icons[notification.type]}</div>
      <div className="notification-content">{notification.message}</div>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
};

export default NotificationProvider;