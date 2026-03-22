import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
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

  // Pagination state
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const totalPages = ref(0);

  // Infinite scroll support
  const appendMode = ref(false);
  const hasMore = computed(() => page.value < totalPages.value);

  async function fetchTickets() {
    loading.value = true;
    try {
      const params = {
        page: page.value,
        page_size: pageSize.value,
      };
      if (filters.status) params.status = filters.status;
      if (filters.issue_type) params.issue_type = filters.issue_type;
      if (filters.room_id) params.room_id = filters.room_id;

      const { data } = await apiClient.get('/tickets', { params });

      // Handle both paginated response { data, total, total_pages } and plain array
      const rows = Array.isArray(data) ? data : (data.data || []);
      if (appendMode.value) {
        tickets.value = [...tickets.value, ...rows];
      } else {
        tickets.value = rows;
      }

      if (!Array.isArray(data) && data.total !== undefined) {
        total.value = data.total;
        totalPages.value = data.total_pages;
      } else {
        // Plain array response — all data in one page
        total.value = rows.length;
        totalPages.value = 1;
      }
    } catch {
      if (!appendMode.value) {
        tickets.value = [];
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadNextPage() {
    if (!hasMore.value) return;
    page.value++;
    appendMode.value = true;
    try {
      await fetchTickets();
    } finally {
      appendMode.value = false;
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
    page.value = 1;
  }

  return {
    tickets,
    loading,
    filters,
    page,
    pageSize,
    total,
    totalPages,
    appendMode,
    hasMore,
    fetchTickets,
    loadNextPage,
    createTicket,
    getTicket,
    markComplete,
    resetFilters,
  };
});
