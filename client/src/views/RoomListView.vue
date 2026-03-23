<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('room.title') }}</h1>
      <button v-if="isDesktop && authStore.isAdmin" class="btn btn-primary btn-icon" @click="$router.push('/rooms/new')">
        <SvgIcon name="plus" :size="18" />
        {{ t('room.createTitle') }}
      </button>
    </div>

    <!-- Mobile Filter / Desktop Filter Bar -->
    <MobileFilter
      :filters="filters"
      :filter-fields="filterFields"
      :active-count="activeFilterCount"
      @apply="handleFilterApply"
      @reset="handleReset"
    />

    <div class="card">
      <PullToRefresh :loading="store.loading" @refresh="handlePullRefresh">
        <DataTable
          :columns="columns"
          :data="filteredRooms"
          :loading="store.loading"
          :card-mode="!isDesktop"
          card-title-key="room_name_cn"
          card-subtitle-key="room_type_label"
          card-status-key="status"
          :card-link-fn="cardLinkFn"
        >
          <template #cell-room_name_cn="{ row }">
            <router-link :to="`/rooms/${row.id}`" class="link">{{ row.room_name_cn }}</router-link>
          </template>
          <template #cell-room_type="{ row }">
            {{ t('enum.roomType.' + row.room_type) }}
          </template>
          <template #cell-base_daily_rate="{ row }">
            {{ formatNumber(row.base_daily_rate) }}
          </template>
          <template #cell-status="{ row }">
            <span class="status-badge" :class="'status-' + row.status">
              <SvgIcon :name="statusIcon(row.status)" :size="14" />
              {{ t('enum.roomStatus.' + row.status) }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div v-if="authStore.isAdmin" class="action-btns">
              <router-link :to="`/rooms/${row.id}`" class="btn btn-sm btn-outline">{{ t('common.edit') }}</router-link>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(row)">{{ t('common.delete') }}</button>
            </div>
          </template>
        </DataTable>
      </PullToRefresh>
    </div>

    <!-- Mobile create button -->
    <div v-if="!isDesktop && authStore.isAdmin" class="mobile-create-bar">
      <button class="btn btn-primary mobile-create-btn btn-icon" @click="$router.push('/rooms/new')">
        <SvgIcon name="plus" :size="18" />
        {{ t('room.createTitle') }}
      </button>
    </div>

    <ConfirmDialog
      :visible="!!deletingRoom"
      :title="t('common.confirmDelete')"
      :message="deletingRoom?.room_name_cn"
      @confirm="handleDelete"
      @cancel="deletingRoom = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoomStore } from '../stores/room.js';
import { useAuthStore } from '../stores/auth.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useToast } from '../composables/useToast.js';
import DataTable from '../components/common/DataTable.vue';
import MobileFilter from '../components/common/MobileFilter.vue';
import PullToRefresh from '../components/common/PullToRefresh.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const store = useRoomStore();
const authStore = useAuthStore();
const isDesktop = useMediaQuery('(min-width: 768px)');
const toast = useToast();

const deletingRoom = ref(null);
const deleting = ref(false);

const filters = reactive({
  room_type: '',
  status: '',
});

const columns = computed(() => [
  { key: 'room_name_cn', label: t('room.nameCn') },
  { key: 'room_name_en', label: t('room.nameEn') },
  { key: 'room_type', label: t('room.roomType') },
  { key: 'base_daily_rate', label: t('room.baseDailyRate') },
  { key: 'status', label: t('room.roomStatus') },
  { key: 'actions', label: '' },
]);

const filterFields = computed(() => [
  {
    key: 'room_type',
    label: t('room.roomType'),
    type: 'select',
    options: [
      { value: 'villa', label: t('enum.roomType.villa') },
      { value: 'homestay', label: t('enum.roomType.homestay') },
      { value: 'apartment', label: t('enum.roomType.apartment') },
    ]
  },
  {
    key: 'status',
    label: t('room.roomStatus'),
    type: 'select',
    options: [
      { value: 'active', label: t('enum.roomStatus.active') },
      { value: 'maintenance', label: t('enum.roomStatus.maintenance') },
    ]
  }
]);

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.room_type) count++;
  if (filters.status) count++;
  return count;
});

// Client-side filtering since rooms is a small list
const filteredRooms = computed(() => {
  let result = store.rooms;
  if (filters.room_type) {
    result = result.filter(r => r.room_type === filters.room_type);
  }
  if (filters.status) {
    result = result.filter(r => r.status === filters.status);
  }
  // Add translated room_type_label for card subtitle
  return result.map(r => ({
    ...r,
    room_type_label: t('enum.roomType.' + r.room_type)
  }));
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
  return `/rooms/${row.id}`;
}

function formatNumber(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function handleFilterApply(newFilters) {
  Object.assign(filters, newFilters);
}

function handleReset() {
  filters.room_type = '';
  filters.status = '';
}

function handlePullRefresh() {
  filters.room_type = '';
  filters.status = '';
  store.fetchRooms();
}

function confirmDelete(room) {
  deletingRoom.value = room;
}

async function handleDelete() {
  if (!deletingRoom.value) return;
  deleting.value = true;
  try {
    await store.deleteRoom(deletingRoom.value.id);
    toast.success(t('common.delete'));
    deletingRoom.value = null;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    deleting.value = false;
  }
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

.link {
  color: #2563eb;
  font-weight: 500;
}
.link:hover {
  text-decoration: underline;
}

.mobile-create-bar {
  margin-top: var(--spacing-md);
}

.mobile-create-btn {
  width: 100%;
}

.action-btns {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.625rem;
  font-size: 0.8125rem;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>
