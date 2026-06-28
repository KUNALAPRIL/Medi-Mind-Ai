import axios from 'axios';

export const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const savedLanguage = localStorage.getItem('language') || 'en';
  config.headers['accept-language'] = savedLanguage;
  config.headers['x-language'] = savedLanguage;
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const savedUser = localStorage.getItem('user');
        const savedRefreshToken = localStorage.getItem('refreshToken');
        if (!savedUser || !savedRefreshToken) throw new Error('No user credentials cached');

        // Trigger refresh request token
        const refreshResponse = await axios.post('/api/v1/auth/refresh', {
          refreshToken: savedRefreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
