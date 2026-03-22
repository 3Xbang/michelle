<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('booking.title') }}</h1>
      <router-link v-if="isDesktop" to="/bookings/new" class="btn btn-primary btn-icon">
        <SvgIcon name="plus" :size="18" />
        {{ t('booking.createTitle') }}
      </router-link>
    </div>

    <!-- Mobile Filter / Desktop Filter Bar -->
    <MobileFilter
      :filters="store.filters"
      :filter-fields="filterFields"
      :active-count="activeFilterCount"
      @apply="handleFilterApply"
      @reset="handleReset"
    />

    <!-- Data List with PullToRefresh -->
    <div class="card">
      <PullToRefresh :loading="store.loading" @refresh="handlePullRefresh">
        <DataTable
          :columns="columns"
          :data="store.bookings"
          :loading="store.loading"
          :sort-key="store.sortKey"
          :sort-order="store.sortOrder"
          :page="store.page"
          :page-size="store.pageSize"
          :total="store.total"
          :card-mode="!isDesktop"
          card-title-key="guest_name"
          card-subtitle-key="room_name"
          card-status-key="booking_status"
          :card-link-fn="cardLinkFn"
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
              <SvgIcon :name="statusIcon(row.booking_status)" :size="14" />
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

        <!-- Loaded all hint -->
        <div v-if="!store.hasMore && store.bookings.length > 0 && !isDesktop" class="loaded-all">
          {{ t('infiniteScroll.loadedAll') }}
        </div>
      </PullToRefresh>

      <!-- Page size selector (desktop only) -->
      <div v-if="isDesktop" class="page-size-bar">
        <label class="form-label">{{ t('pagination.pageSize', { size: store.pageSize }) }}</label>
        <select v-model.number="store.pageSize" class="form-select page-size-select" @change="handlePageSizeChange">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- FAB for mobile -->
    <FloatingActionButton
      to="/bookings/new"
      icon="plus"
      :label="t('booking.createTitle')"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBookingStore } from '../stores/booking.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js';
import apiClient from '../api/client.js';
import DataTable from '../components/common/DataTable.vue';
import MobileFilter from '../components/common/MobileFilter.vue';
import FloatingActionButton from '../components/common/FloatingActionButton.vue';
import PullToRefresh from '../components/common/PullToRefresh.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';

const { t } = useI18n();
const store = useBookingStore();
const isDesktop = useMediaQuery('(min-width: 768px)');

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

const filterFields = computed(() => [
  {
    key: 'room_id',
    label: t('booking.room'),
    type: 'select',
    options: rooms.value.map(r => ({
      value: r.id,
      label: `${r.room_name_cn} / ${r.room_name_en}`
    }))
  },
  {
    key: 'status',
    label: t('booking.bookingStatus'),
    type: 'select',
    options: [
      { value: 'pending', label: t('enum.bookingStatus.pending') },
      { value: 'checked_in', label: t('enum.bookingStatus.checked_in') },
      { value: 'checked_out', label: t('enum.bookingStatus.checked_out') },
    ]
  },
  {
    key: 'platform',
    label: t('booking.platformSource'),
    type: 'select',
    options: platforms.map(p => ({ value: p, label: t('enum.platform.' + p) }))
  },
  {
    key: 'from',
    label: t('report.from'),
    type: 'date'
  },
  {
    key: 'to',
    label: t('report.to'),
    type: 'date'
  }
]);

const activeFilterCount = computed(() => {
  let count = 0;
  if (store.filters.room_id) count++;
  if (store.filters.status) count++;
  if (store.filters.platform) count++;
  if (store.filters.from) count++;
  if (store.filters.to) count++;
  return count;
});

const STATUS_ICON_MAP = {
  pending: 'clock',
  checked_in: 'check',
  completed: 'check',
  checked_out: 'close',
  urgent: 'warning',
  active: 'check',
  maintenance: 'warning',
};

function statusIcon(status) {
  return STATUS_ICON_MAP[status] || 'clock';
}

function cardLinkFn(row) {
  return `/bookings/${row.id}`;
}

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

function handleFilterApply(newFilters) {
  Object.assign(store.filters, newFilters);
  store.page = 1;
  store.fetchBookings();
}

function handleReset() {
  store.resetFilters();
  store.fetchBookings();
}

function handlePullRefresh() {
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

// Infinite scroll
useInfiniteScroll({
  loadMore: () => store.loadNextPage(),
  hasMore: computed(() => store.hasMore),
  threshold: 200
});

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

.loaded-all {
  text-align: center;
  padding: var(--spacing-md) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
