import apiClient from './client.js';

// 预售房源
export const salesPropertiesApi = {
  list: (params) => apiClient.get('/sales/properties', { params }),
  get: (id) => apiClient.get(`/sales/properties/${id}`),
  create: (data) => apiClient.post('/sales/properties', data),
  update: (id, data) => apiClient.put(`/sales/properties/${id}`, data),
  remove: (id) => apiClient.delete(`/sales/properties/${id}`),
  uploadPhoto: (id, formData) => apiClient.post(`/sales/properties/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePhotoOrder: (id, orders) => apiClient.put(`/sales/properties/${id}/photos/order`, { orders }),
  setCoverPhoto: (id, photoId) => apiClient.put(`/sales/properties/${id}/photos/${photoId}/cover`),
  deletePhoto: (id, photoId) => apiClient.delete(`/sales/properties/${id}/photos/${photoId}`),
};

// 客户档案
export const customersApi = {
  list: (params) => apiClient.get('/sales/customers', { params }),
  getPending: () => apiClient.get('/sales/customers/pending'),
  get: (id) => apiClient.get(`/sales/customers/${id}`),
  create: (data) => apiClient.post('/sales/customers', data),
  update: (id, data) => apiClient.put(`/sales/customers/${id}`, data),
  remove: (id) => apiClient.delete(`/sales/customers/${id}`),
  assign: (id, salesperson_id) => apiClient.put(`/sales/customers/${id}/assign`, { salesperson_id }),
};

// 看房记录
export const viewingRecordsApi = {
  list: (params) => apiClient.get('/sales/viewing-records', { params }),
  create: (data) => apiClient.post('/sales/viewing-records', data),
  update: (id, data) => apiClient.put(`/sales/viewing-records/${id}`, data),
  remove: (id) => apiClient.delete(`/sales/viewing-records/${id}`),
};

// 购买意向
export const intentsApi = {
  list: (params) => apiClient.get('/sales/intents', { params }),
  create: (data) => apiClient.post('/sales/intents', data),
  update: (id, data) => apiClient.put(`/sales/intents/${id}`, data),
  remove: (id) => apiClient.delete(`/sales/intents/${id}`),
  getFollowUps: (id) => apiClient.get(`/sales/intents/${id}/follow-ups`),
  addFollowUp: (id, data) => apiClient.post(`/sales/intents/${id}/follow-ups`, data),
};

// 业绩统计
export const reportsApi = {
  get: (params) => apiClient.get('/sales/reports', { params }),
};

// 跟进提醒
export const remindersApi = {
  list: () => apiClient.get('/sales/reminders'),
};

// 广告素材
export const adMaterialsApi = {
  list: (params) => apiClient.get('/sales/ad-materials', { params }),
  get: (id) => apiClient.get(`/sales/ad-materials/${id}`),
  create: (data) => apiClient.post('/sales/ad-materials', data),
  update: (id, data) => apiClient.put(`/sales/ad-materials/${id}`, data),
  updateStatus: (id, ad_status) => apiClient.put(`/sales/ad-materials/${id}/status`, { ad_status }),
  remove: (id) => apiClient.delete(`/sales/ad-materials/${id}`),
  downloadZip: (id) => apiClient.get(`/sales/ad-materials/${id}/download`, { responseType: 'blob' }),
};
