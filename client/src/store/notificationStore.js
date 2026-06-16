import { create } from 'zustand';
import api from '../utils/api';

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const { data } = await api.get('/notifications');
    set({ notifications: data.notifications, unreadCount: data.unreadCount });
  },

  markAllRead: async () => {
    await api.put('/notifications/mark-all-read');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  addNotification: (notif) =>
    set((state) => ({ unreadCount: state.unreadCount + 1, notifications: [notif, ...state.notifications] })),

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((state) => ({ notifications: state.notifications.filter((n) => n._id !== id) }));
  },
}));
