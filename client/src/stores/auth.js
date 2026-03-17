import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '../api/client.js';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'Admin');

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function updateUser(userData) {
    user.value = { ...user.value, ...userData };
    localStorage.setItem('user', JSON.stringify(user.value));
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    updateUser,
  };
});
