import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import apiClient from '../api/client.js';

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref([]);
  const loading = ref(false);

  // Filter state
  const filters = reactive({
    room_id: '',
    status: '',
    platform: '',
    from: '',
    to: '',
  });

  // Sort state
  const sortKey = ref('created_at');
  const sortOrder = ref('desc');

  // Pagination state
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const totalPages = ref(0);

  // Infinite scroll support
  const appendMode = ref(false);
  const hasMore = computed(() => page.value < totalPages.value);

  async function fetchBookings() {
    loading.value = true;
    try {
      const params = {
        page: page.value,
        page_size: pageSize.value,
        sort: sortKey.value,
        order: sortOrder.value,
      };
      if (filters.room_id) params.room_id = filters.room_id;
      if (filters.status) params.status = filters.status;
      if (filters.platform) params.platform = filters.platform;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const { data } = await apiClient.get('/bookings', { params });
      if (appendMode.value) {
        bookings.value = [...bookings.value, ...data.data];
      } else {
        bookings.value = data.data;
      }
      total.value = data.total;
      totalPages.value = data.total_pages;
    } catch {
      bookings.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function createBooking(bookingData) {
    const { data } = await apiClient.post('/bookings', bookingData);
    return data;
  }

  async function updateBooking(id, bookingData) {
    const { data } = await apiClient.put(`/bookings/${id}`, bookingData);
    return data;
  }

  async function updateBookingStatus(id, status) {
    const { data } = await apiClient.patch(`/bookings/${id}/status`, { booking_status: status });
    return data;
  }

  async function getBooking(id) {
    const { data } = await apiClient.get(`/bookings/${id}`);
    return data;
  }

  async function loadNextPage() {
    if (!hasMore.value) return;
    page.value++;
    appendMode.value = true;
    try {
      await fetchBookings();
    } finally {
      appendMode.value = false;
    }
  }

  function resetFilters() {
    filters.room_id = '';
    filters.status = '';
    filters.platform = '';
    filters.from = '';
    filters.to = '';
    page.value = 1;
  }

  return {
    bookings,
    loading,
    filters,
    sortKey,
    sortOrder,
    page,
    pageSize,
    total,
    totalPages,
    appendMode,
    hasMore,
    fetchBookings,
    createBooking,
    updateBooking,
    updateBookingStatus,
    getBooking,
    loadNextPage,
    resetFilters,
  };
});
