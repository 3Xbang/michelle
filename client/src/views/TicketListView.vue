<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('ticket.title') }}</h1>
      <router-link v-if="isDesktop" to="/tickets/new" class="btn btn-primary btn-icon">
        <SvgIcon name="plus" :size="18" />
        {{ t('ticket.createTitle') }}
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

    <!-- Ticket List with PullToRefresh -->
    <div class="card">
      <PullToRefresh :loading="store.loading" @refresh="handlePullRefresh">
        <DataTable
          :columns="columns"
          :data="store.tickets"
          :loading="store.loading"
          sort-key=""
          sort-order="asc"
          :page="store.page"
          :page-size="store.pageSize"
          :total="store.total"
          :card-mode="!isDesktop"
          card-title-key="id"
          card-subtitle-key="description"
          card-status-key="ticket_status"
          :card-link-fn="cardLinkFn"
          @page-change="handlePageChange"
        >
          <template #cell-id="{ row }">
            <router-link :to="`/tickets/${row.id}`" class="link">
              #{{ row.id }}
            </router-link>
          </template>
          <template #cell-issue_type="{ row }">
            {{ t('enum.issueType.' + row.issue_type) }}
          </template>
          <template #cell-room_name="{ row }">
            {{ row.room_name_cn || row.room_name || '-' }}
          </template>
          <template #cell-ticket_status="{ row }">
            <span class="status-badge" :class="'status-' + row.ticket_status">
              <SvgIcon :name="statusIcon(row.ticket_status)" :size="14" />
              {{ t('enum.ticketStatus.' + row.ticket_status) }}
            </span>
          </template>
          <template #cell-priority="{ row }">
            <span v-if="row.priority === 'urgent'" class="priority-badge priority-urgent">
              {{ t('enum.priority.urgent') }}
            </span>
            <span v-else>{{ row.priority ? t('enum.priority.' + row.priority) : '-' }}</span>
          </template>
          <template #cell-actions="{ row }">
            <button
              v-if="authStore.isAdmin && row.ticket_status === 'pending'"
              class="btn btn-outline btn-sm btn-icon"
              @click.stop="handleMarkComplete(row.id)"
            >
              <SvgIcon name="check" :size="16" />
              {{ t('ticket.markComplete') }}
            </button>
          </template>
        </DataTable>

        <!-- Loaded all hint -->
        <div v-if="!store.hasMore && store.tickets.length > 0 && !isDesktop" class="loaded-all">
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
      to="/tickets/new"
      icon="plus"
      :label="t('ticket.createTitle')"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTicketStore } from '../stores/ticket.js';
import { useAuthStore } from '../stores/auth.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';
import DataTable from '../components/common/DataTable.vue';
import MobileFilter from '../components/common/MobileFilter.vue';
import FloatingActionButton from '../components/common/FloatingActionButton.vue';
import PullToRefresh from '../components/common/PullToRefresh.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';

const { t } = useI18n();
const store = useTicketStore();
const authStore = useAuthStore();
const toast = useToast();
const isDesktop = useMediaQuery('(min-width: 768px)');

const issueTypes = ['plumbing', 'furniture', 'cleaning', 'network', 'other'];
const rooms = ref([]);

const columns = computed(() => [
  { key: 'id', label: '#' },
  { key: 'issue_type', label: t('ticket.issueType') },
  { key: 'room_name', label: t('booking.room') },
  { key: 'description', label: t('ticket.description') || t('common.description') || 'Description' },
  { key: 'ticket_status', label: t('common.status') },
  { key: 'priority', label: t('ticket.priority') || 'Priority' },
  { key: 'created_at', label: t('common.createdAt') },
  { key: 'actions', label: '' },
]);

const filterFields = computed(() => [
  {
    key: 'status',
    label: t('common.status'),
    type: 'select',
    options: [
      { value: 'pending', label: t('enum.ticketStatus.pending') },
      { value: 'completed', label: t('enum.ticketStatus.completed') },
    ]
  },
  {
    key: 'issue_type',
    label: t('ticket.issueType'),
    type: 'select',
    options: issueTypes.map(it => ({
      value: it,
      label: t('enum.issueType.' + it)
    }))
  },
  {
    key: 'room_id',
    label: t('booking.room'),
    type: 'select',
    options: rooms.value.map(r => ({
      value: r.id,
      label: `${r.room_name_cn} / ${r.room_name_en}`
    }))
  }
]);

const activeFilterCount = computed(() => {
  let count = 0;
  if (store.filters.status) count++;
  if (store.filters.issue_type) count++;
  if (store.filters.room_id) count++;
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
  return `/tickets/${row.id}`;
}

function handlePageChange(p) {
  store.page = p;
  store.fetchTickets();
}

function handlePageSizeChange() {
  store.page = 1;
  store.fetchTickets();
}

function handleFilterApply(newFilters) {
  Object.assign(store.filters, newFilters);
  store.page = 1;
  store.fetchTickets();
}

function handleReset() {
  store.resetFilters();
  store.fetchTickets();
}

function handlePullRefresh() {
  store.resetFilters();
  store.fetchTickets();
}

async function handleMarkComplete(id) {
  try {
    await store.markComplete(id);
    toast.success(t('ticket.markComplete'));
    store.fetchTickets();
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  }
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
  store.fetchTickets();
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

.priority-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-urgent {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
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
