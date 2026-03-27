import api from './client.js';

// Properties
export const getProperties = (type) => api.get('/miraa/properties', { params: type ? { type } : {} });
export const getProperty = (id) => api.get(`/miraa/properties/${id}`);
export const createProperty = (data) => api.post('/miraa/properties', data);
export const updateProperty = (id, data) => api.put(`/miraa/properties/${id}`, data);
export const deleteProperty = (id) => api.delete(`/miraa/properties/${id}`);
export const uploadPropertyPhoto = (id, file) => {
  const form = new FormData();
  form.append('photo', file);
  return api.post(`/miraa/properties/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deletePropertyPhoto = (id, photoId) => api.delete(`/miraa/properties/${id}/photos/${photoId}`);
export const setCoverPhoto = (id, photoId) => api.put(`/miraa/properties/${id}/photos/${photoId}/cover`);

// Banners
export const getBanners = () => api.get('/miraa/banners');
export const uploadBanner = (file) => {
  const form = new FormData();
  form.append('photo', file);
  return api.post('/miraa/banners', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const deleteBanner = (id) => api.delete(`/miraa/banners/${id}`);
export const updateBannerOrder = (orders) => api.put('/miraa/banners/order', { orders });

// Settings
export const getSettings = () => api.get('/miraa/settings');
export const updateSettings = (data) => api.put('/miraa/settings', data);
