<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('booking.title') }}</h1>
      <router-link to="/bookings/new" class="btn btn-primary">
        {{ t('booking.createTitle') }}
      </router-link>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-item">
        <label class="form-label">{{ t('booking.room') }}</label>
        <select v-model="store.filters.room_id" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.room_name_cn }} / {{ room.room_name_en }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('booking.bookingStatus') }}</label>
        <select v-model="store.filters.status" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option value="pending">{{ t('enum.bookingStatus.pending') }}</option>
          <option value="checked_in">{{ t('enum.bookingStatus.checked_in') }}</option>
          <option value="checked_out">{{ t('enum.bookingStatus.checked_out') }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('booking.platformSource') }}</label>
        <select v-model="store.filters.platform" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="p in platforms" :key="p" :value="p">{{ t('enum.platform.' + p) }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('report.from') }}</label>
        <input v-model="store.filters.from" type="date" class="form-input" @change="applyFilter" />
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('report.to') }}</label>
        <input v-model="store.filters.to" type="date" class="form-input" @change="applyFilter" />
      </div>
      <div class="filter-item filter-actions">
        <button class="btn btn-outline" @click="handleReset">{{ t('common.reset') }}</button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <DataTable
        :columns="columns"
        :data="store.bookings"
        :loading="store.loading"
        :sort-key="store.sortKey"
        :sort-order="store.sortOrder"
        :page="store.page"
        :page-size="store.pageSize"
        :total="store.total"
        @sort="handleSort"
        @page-change="handlePageChange"
      >
        <template #cell-guest_name="{ row }">
          <router-link :to="`/bookings/${row.id}`" class="link">{{ row.guest_name }}</router-link>
        </template>
        <template #cell-room_name="{ row }">
          {{ row.room_name_cn || row.room_name || '-' }}
        </template>
        <template #cell-booking_status="{ row }">
          <span class="status-badge" :class="'status-' + row.booking_status">
            {{ t('enum.bookingStatus.' + row.booking_status) }}
          </span>
        </template>
        <template #cell-platform_source="{ row }">
          {{ t('enum.platform.' + row.platform_source) }}
        </template>
        <template #cell-total_revenue="{ row }">
          {{ formatNumber(row.total_revenue) }}
        </template>
      </DataTable>

      <!-- Page size selector -->
      <div class="page-size-bar">
        <label class="form-label">{{ t('pagination.pageSize', { size: store.pageSize }) }}</label>
        <select v-model.number="store.pageSize" class="form-select page-size-select" @change="handlePageSizeChange">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBookingStore } from '../stores/booking.js';
import apiClient from '../api/client.js';
import DataTable from '../components/common/DataTable.vue';

const { t } = useI18n();
const store = useBookingStore();

const platforms = [
  'Airbnb', 'Agoda', 'Booking.com', 'Trip.com',
  '途家', '小猪', '美团民宿', '飞猪',
  'Expedia', 'VRBO', '直客', '其他',
];

const rooms = ref([]);

const columns = computed(() => [
  { key: 'guest_name', label: t('booking.guestName') },
  { key: 'room_name', label: t('booking.room') },
  { key: 'check_in', label: t('booking.checkIn'), sortable: true },
  { key: 'check_out', label: t('booking.checkOut'), sortable: true },
  { key: 'platform_source', label: t('booking.platformSource') },
  { key: 'booking_status', label: t('booking.bookingStatus') },
  { key: 'total_revenue', label: t('booking.totalRevenue'), sortable: true },
  { key: 'created_at', label: t('common.createdAt'), sortable: true },
]);

function formatNumber(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleSort(key) {
  if (store.sortKey === key) {
    store.sortOrder = store.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    store.sortKey = key;
    store.sortOrder = 'asc';
  }
  store.fetchBookings();
}

function handlePageChange(p) {
  store.page = p;
  store.fetchBookings();
}

function handlePageSizeChange() {
  store.page = 1;
  store.fetchBookings();
}

function applyFilter() {
  store.page = 1;
  store.fetchBookings();
}

function handleReset() {
  store.resetFilters();
  store.fetchBookings();
}

async function loadRooms() {
  try {
    const { data } = await apiClient.get('/rooms');
    rooms.value = Array.isArray(data) ? data : (data.data || []);
  } catch {
    rooms.value = [];
  }
}

onMounted(() => {
  loadRooms();
  store.fetchBookings();
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header .page-title {
  margin-bottom: 0;
}

.filter-item {
  min-width: 140px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.link {
  color: #2563eb;
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}

.page-size-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.page-size-select {
  width: auto;
  min-width: 70px;
}
</style>
