import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/mira/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (redirect to login), network errors, business errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error - will be handled by caller
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use window.location for redirect since we don't have router access here
      if (window.location.pathname !== '/mira/login') {
        window.location.href = '/mira/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
