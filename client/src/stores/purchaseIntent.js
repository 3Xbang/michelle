import { defineStore } from 'pinia';
import { intentsApi } from '../api/sales.js';

export const usePurchaseIntentStore = defineStore('purchaseIntent', {
  state: () => ({
    intents: [],
    currentIntent: null,
    followUps: [],
    loading: false,
  }),
  actions: {
    async fetchIntents(filters = {}) {
      this.loading = true;
      try {
        const { data } = await intentsApi.list(filters);
        this.intents = data;
      } finally { this.loading = false; }
    },
    async createIntent(formData) {
      const { data } = await intentsApi.create(formData);
      this.intents.unshift(data);
      return data;
    },
    async updateIntentLevel(id, intent_level) {
      const { data } = await intentsApi.update(id, { intent_level });
      const idx = this.intents.findIndex(i => i.id === id);
      if (idx !== -1) this.intents[idx] = data;
      if (this.currentIntent?.id === id) this.currentIntent = data;
      return data;
    },
    async fetchFollowUps(intentId) {
      const { data } = await intentsApi.getFollowUps(intentId);
      this.followUps = data;
    },
    async addFollowUp(intentId, formData) {
      const { data } = await intentsApi.addFollowUp(intentId, formData);
      this.followUps.unshift(data);
      return data;
    },
  },
});
