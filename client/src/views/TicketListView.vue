<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('ticket.title') }}</h1>
      <router-link to="/tickets/new" class="btn btn-primary">
        {{ t('ticket.createTitle') }}
      </router-link>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-item">
        <label class="form-label">{{ t('common.status') }}</label>
        <select v-model="store.filters.status" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option value="pending">{{ t('enum.ticketStatus.pending') }}</option>
          <option value="completed">{{ t('enum.ticketStatus.completed') }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('ticket.issueType') }}</label>
        <select v-model="store.filters.issue_type" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="it in issueTypes" :key="it" :value="it">
            {{ t('enum.issueType.' + it) }}
          </option>
        </select>
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('booking.room') }}</label>
        <select v-model="store.filters.room_id" class="form-select" @change="applyFilter">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">
            {{ room.room_name_cn }} / {{ room.room_name_en }}
          </option>
        </select>
      </div>
      <div class="filter-item filter-actions">
        <button class="btn btn-outline" @click="handleReset">{{ t('common.reset') }}</button>
      </div>
    </div>

    <!-- Ticket List -->
    <div class="card">
      <div v-if="store.loading" class="table-loading">{{ t('common.loading') }}</div>
      <div v-else-if="store.tickets.length === 0" class="table-empty">{{ t('common.noData') }}</div>
      <div v-else class="ticket-list">
        <div v-for="ticket in store.tickets" :key="ticket.id" class="ticket-card">
          <div class="ticket-card-header">
            <router-link :to="`/tickets/${ticket.id}`" class="ticket-link">
              #{{ ticket.id }}
            </router-link>
            <div class="ticket-badges">
              <span v-if="ticket.priority === 'urgent'" class="priority-badge priority-urgent">
                {{ t('enum.priority.urgent') }}
              </span>
              <span class="status-badge" :class="'status-' + ticket.ticket_status">
                {{ t('enum.ticketStatus.' + ticket.ticket_status) }}
              </span>
            </div>
          </div>
          <div class="ticket-card-body">
            <div class="ticket-meta">
              <span class="ticket-type">{{ t('enum.issueType.' + ticket.issue_type) }}</span>
              <span class="ticket-room">{{ ticket.room_name_cn || ticket.room_name || '-' }}</span>
            </div>
            <p class="ticket-desc">{{ ticket.description }}</p>
          </div>
          <div class="ticket-card-footer">
            <span class="ticket-date">{{ ticket.created_at }}</span>
            <button
              v-if="authStore.isAdmin && ticket.ticket_status === 'pending'"
              class="btn btn-outline btn-sm"
              @click="handleMarkComplete(ticket.id)"
            >
              {{ t('ticket.markComplete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTicketStore } from '../stores/ticket.js';
import { useAuthStore } from '../stores/auth.js';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';

const { t } = useI18n();
const store = useTicketStore();
const authStore = useAuthStore();
const toast = useToast();

const issueTypes = ['plumbing', 'furniture', 'cleaning', 'network', 'other'];
const rooms = ref([]);

function applyFilter() {
  store.fetchTickets();
}

function handleReset() {
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

.filter-item {
  min-width: 140px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.table-loading,
.table-empty {
  text-align: center;
  padding: 2rem 0.75rem;
  color: #6b7280;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ticket-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.ticket-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.ticket-link {
  color: #2563eb;
  font-weight: 600;
}
.ticket-link:hover {
  text-decoration: underline;
}

.ticket-badges {
  display: flex;
  gap: 0.5rem;
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

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending {
  background: #fef9c3;
  color: #a16207;
}

.status-completed {
  background: #dcfce7;
  color: #15803d;
}

.ticket-card-body {
  margin-bottom: 0.5rem;
}

.ticket-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.ticket-desc {
  font-size: 0.875rem;
  color: #374151;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #9ca3af;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}
</style>
