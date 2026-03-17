<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('room.title') }}</h1>
    </div>

    <div class="card">
      <div v-if="store.loading" class="table-loading">{{ t('common.loading') }}</div>
      <div v-else-if="store.rooms.length === 0" class="table-empty">{{ t('common.noData') }}</div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('room.nameCn') }}</th>
              <th>{{ t('room.nameEn') }}</th>
              <th>{{ t('room.roomType') }}</th>
              <th>{{ t('room.baseDailyRate') }}</th>
              <th>{{ t('room.roomStatus') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in store.rooms" :key="room.id">
              <td>{{ room.room_name_cn }}</td>
              <td>{{ room.room_name_en }}</td>
              <td>{{ t('enum.roomType.' + room.room_type) }}</td>
              <td>{{ formatNumber(room.base_daily_rate) }}</td>
              <td>
                <span class="status-badge" :class="'status-' + room.status">
                  {{ t('enum.roomStatus.' + room.status) }}
                </span>
              </td>
              <td>
                <router-link :to="`/rooms/${room.id}`" class="btn btn-outline btn-sm">
                  {{ t('common.edit') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoomStore } from '../stores/room.js';

const { t } = useI18n();
const store = useRoomStore();

function formatNumber(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

onMounted(() => {
  store.fetchRooms();
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

.table-loading,
.table-empty {
  text-align: center;
  padding: 2rem 0.75rem;
  color: #6b7280;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.625rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-maintenance {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}
</style>
