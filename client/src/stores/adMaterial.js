import { defineStore } from 'pinia';
import { adMaterialsApi } from '../api/sales.js';

export const useAdMaterialStore = defineStore('adMaterial', {
  state: () => ({
    materials: [],
    currentMaterial: null,
    loading: false,
  }),
  actions: {
    async fetchMaterials(filters = {}) {
      this.loading = true;
      try {
        const { data } = await adMaterialsApi.list(filters);
        this.materials = data;
      } finally { this.loading = false; }
    },
    async fetchMaterial(id) {
      const { data } = await adMaterialsApi.get(id);
      this.currentMaterial = data;
      return data;
    },
    async createMaterial(formData) {
      const { data } = await adMaterialsApi.create(formData);
      this.materials.unshift(data);
      return data;
    },
    async updateMaterial(id, formData) {
      const { data } = await adMaterialsApi.update(id, formData);
      const idx = this.materials.findIndex(m => m.id === id);
      if (idx !== -1) this.materials[idx] = data;
      return data;
    },
    async updateStatus(id, status) {
      const { data } = await adMaterialsApi.updateStatus(id, status);
      const idx = this.materials.findIndex(m => m.id === id);
      if (idx !== -1) this.materials[idx] = data;
      return data;
    },
    async deleteMaterial(id) {
      await adMaterialsApi.remove(id);
      this.materials = this.materials.filter(m => m.id !== id);
    },
    async downloadZip(id, filename) {
      const { data } = await adMaterialsApi.downloadZip(id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'ad-material.zip';
      a.click();
      URL.revokeObjectURL(url);
    },
  },
});
