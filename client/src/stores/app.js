import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiClient from '../api/client.js';

export const useAppStore = defineStore('app', () => {
  const language = ref(localStorage.getItem('lang') || 'zh-CN');
  const configs = ref([]);
  const configLoading = ref(false);

  function setLanguage(lang) {
    language.value = lang;
    localStorage.setItem('lang', lang);
  }

  async function fetchConfigs() {
    configLoading.value = true;
    try {
      const { data } = await apiClient.get('/config');
      configs.value = Array.isArray(data) ? data : (data.data || []);
    } catch {
      configs.value = [];
    } finally {
      configLoading.value = false;
    }
  }

  async function createConfig(configData) {
    const { data } = await apiClient.post('/config', configData);
    return data;
  }

  async function updateConfig(id, configData) {
    const { data } = await apiClient.put(`/config/${id}`, configData);
    return data;
  }

  return {
    language,
    configs,
    configLoading,
    setLanguage,
    fetchConfigs,
    createConfig,
    updateConfig,
  };
});
