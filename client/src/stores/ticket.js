import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import apiClient from '../api/client.js';

export const useTicketStore = defineStore('ticket', () => {
  const tickets = ref([]);
  const loading = ref(false);

  // Filter state
  const filters = reactive({
    status: '',
    issue_type: '',
    room_id: '',
  });

  async function fetchTickets() {
    loading.value = true;
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.issue_type) params.issue_type = filters.issue_type;
      if (filters.room_id) params.room_id = filters.room_id;

      const { data } = await apiClient.get('/tickets', { params });
      tickets.value = Array.isArray(data) ? data : (data.data || []);
    } catch {
      tickets.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createTicket(formData) {
    const { data } = await apiClient.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  async function getTicket(id) {
    const { data } = await apiClient.get(`/tickets/${id}`);
    return data;
  }

  async function markComplete(id) {
    const { data } = await apiClient.patch(`/tickets/${id}/complete`);
    return data;
  }

  function resetFilters() {
    filters.status = '';
    filters.issue_type = '';
    filters.room_id = '';
  }

  return {
    tickets,
    loading,
    filters,
    fetchTickets,
    createTicket,
    getTicket,
    markComplete,
    resetFilters,
  };
});
