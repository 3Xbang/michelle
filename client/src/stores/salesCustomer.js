import { defineStore } from 'pinia';
import { customersApi } from '../api/sales.js';

export const useSalesCustomerStore = defineStore('salesCustomer', {
  state: () => ({
    customers: [],
    currentCustomer: null,
    pendingCustomers: [],
    loading: false,
  }),
  actions: {
    async fetchCustomers(filters = {}) {
      this.loading = true;
      try {
        const { data } = await customersApi.list(filters);
        this.customers = data;
      } finally { this.loading = false; }
    },
    async fetchPending() {
      const { data } = await customersApi.getPending();
      this.pendingCustomers = data;
    },
    async fetchCustomer(id) {
      const { data } = await customersApi.get(id);
      this.currentCustomer = data;
      return data;
    },
    async createCustomer(formData) {
      const { data } = await customersApi.create(formData);
      this.customers.unshift(data);
      return data;
    },
    async updateCustomer(id, formData) {
      const { data } = await customersApi.update(id, formData);
      const idx = this.customers.findIndex(c => c.id === id);
      if (idx !== -1) this.customers[idx] = data;
      return data;
    },
    async assignCustomer(id, salespersonId) {
      const { data } = await customersApi.assign(id, salespersonId);
      this.pendingCustomers = this.pendingCustomers.filter(c => c.id !== id);
      return data;
    },
  },
});
