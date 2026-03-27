import { defineStore } from 'pinia';
import { salesPropertiesApi } from '../api/sales.js';

export const useSalesPropertyStore = defineStore('salesProperty', {
  state: () => ({
    properties: [],
    currentProperty: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchProperties(filters = {}) {
      this.loading = true;
      try {
        const { data } = await salesPropertiesApi.list(filters);
        this.properties = data;
      } finally { this.loading = false; }
    },
    async fetchProperty(id) {
      const { data } = await salesPropertiesApi.get(id);
      this.currentProperty = data;
      return data;
    },
    async createProperty(formData) {
      const { data } = await salesPropertiesApi.create(formData);
      this.properties.unshift(data);
      return data;
    },
    async updateProperty(id, formData) {
      const { data } = await salesPropertiesApi.update(id, formData);
      const idx = this.properties.findIndex(p => p.id === id);
      if (idx !== -1) this.properties[idx] = data;
      if (this.currentProperty?.id === id) this.currentProperty = data;
      return data;
    },
    async deleteProperty(id) {
      await salesPropertiesApi.remove(id);
      this.properties = this.properties.filter(p => p.id !== id);
    },
    async uploadPhoto(propertyId, file) {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await salesPropertiesApi.uploadPhoto(propertyId, fd);
      if (this.currentProperty?.id === propertyId) {
        this.currentProperty.photos = [...(this.currentProperty.photos || []), data];
      }
      return data;
    },
    async updatePhotoOrder(propertyId, orders) {
      await salesPropertiesApi.updatePhotoOrder(propertyId, orders);
    },
    async setCoverPhoto(propertyId, photoId) {
      await salesPropertiesApi.setCoverPhoto(propertyId, photoId);
      if (this.currentProperty?.id === propertyId) {
        this.currentProperty.photos = this.currentProperty.photos.map(p => ({ ...p, is_cover: p.id === photoId }));
      }
    },
    async deletePhoto(propertyId, photoId) {
      await salesPropertiesApi.deletePhoto(propertyId, photoId);
      if (this.currentProperty?.id === propertyId) {
        this.currentProperty.photos = this.currentProperty.photos.filter(p => p.id !== photoId);
      }
    },
  },
});
