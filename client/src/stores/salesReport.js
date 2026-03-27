import { defineStore } from 'pinia';
import { reportsApi } from '../api/sales.js';

export const useSalesReportStore = defineStore('salesReport', {
  state: () => ({
    reportData: [],
    loading: false,
  }),
  actions: {
    async fetchReport(startDate, endDate) {
      this.loading = true;
      try {
        const { data } = await reportsApi.get({ start_date: startDate, end_date: endDate });
        this.reportData = data;
      } finally { this.loading = false; }
    },
  },
});
