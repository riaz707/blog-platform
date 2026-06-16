import { create } from 'zustand';
import api from '../utils/api';
import { io } from 'socket.io-client';

let socket = null;

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, accessToken: token, isAuthenticated: true });
      get().connectSocket(data.user._id);
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
    get().connectSocket(data.user._id);
    return data;
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('accessToken', data.accessToken);
    set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
    get().connectSocket(data.user._id);
    return data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    if (socket) { socket.disconnect(); socket = null; }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),

  connectSocket: (userId) => {
    if (socket?.connected) return;
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socket.emit('user_online', userId);
  },

  getSocket: () => socket,
}));
