<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('room.title') }}</h1>
      <button v-if="authStore.isAdmin" class="btn btn-primary btn-icon" @click="$router.push('/rooms/new')">
        <SvgIcon name="plus" :size="18" />{{ t('room.createTitle') }}
      </button>
    </div>

    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="treeData.length === 0 && noOwnerRooms.length === 0" class="empty-text">{{ t('common.noData') }}</div>

    <!-- Level 1: Owner cards -->
    <div v-if="!selectedOwner" class="card-grid">
      <div v-for="owner in treeData" :key="'o' + owner.id"
           class="tile tile-owner" @click="selectOwner(owner)">
        <div class="tile-avatar">{{ owner.name.charAt(0) }}</div>
        <div class="tile-name">{{ owner.name }}</div>
        <div v-if="owner.name_en" class="tile-sub">{{ owner.name_en }}</div>
        <div class="tile-count">{{ owner.totalRooms }} {{ t('owner.rooms') }}</div>
      </div>
      <div v-if="noOwnerRooms.length > 0"
           class="tile tile-owner tile-gray" @click="selectOwner({ id: 'no_owner', name: '未分配业主', typeGroups: [], totalRooms: noOwnerRooms.length, _noOwner: true })">
        <div class="tile-avatar tile-avatar-gray">?</div>
        <div class="tile-name">未分配业主</div>
        <div class="tile-count">{{ noOwnerRooms.length }} {{ t('owner.rooms') }}</div>
      </div>
    </div>

    <!-- Level 2: Type cards -->
    <template v-else-if="selectedOwner && !selectedType">
      <div class="breadcrumb">
        <button class="bc-btn" @click="back(1)">{{ t('room.title') }}</button>
        <span class="bc-sep">›</span>
        <span class="bc-cur">{{ selectedOwner.name }}</span>
      </div>
      <div v-if="selectedOwner._noOwner" class="room-list-section">
        <RoomCard v-for="room in noOwnerRooms" :key="room.id" :room="room"
          :is-admin="authStore.isAdmin" @delete="confirmDelete" />
      </div>
      <div v-else class="card-grid">
        <div v-for="tg in selectedOwner.typeGroups" :key="tg.type"
             class="tile tile-type" :class="'tile-' + tg.type" @click="selectType(tg)">
          <div class="tile-icon">{{ tg.icon }}</div>
          <div class="tile-name">{{ t('enum.roomType.' + tg.type) }}</div>
          <div class="tile-count">{{ tg.totalRooms }} {{ t('owner.rooms') }}</div>
        </div>
      </div>
    </template>

    <!-- Level 3: Template cards -->
    <template v-else-if="selectedType && !selectedTemplate">
      <div class="breadcrumb">
        <button class="bc-btn" @click="back(1)">{{ t('room.title') }}</button>
        <span class="bc-sep">›</span>
        <button class="bc-btn" @click="back(2)">{{ selectedOwner.name }}</button>
        <span class="bc-sep">›</span>
        <span class="bc-cur">{{ t('enum.roomType.' + selectedType.type) }}</span>
      </div>
      <div class="card-grid">
        <div v-for="tpl in selectedType.templates" :key="tpl.id"
             class="tile tile-template" @click="selectTemplate(tpl)">
          <div class="tile-proj-name">{{ tpl.project_name || tpl.template_name }}</div>
          <div v-if="tpl.project_name_en" class="tile-sub">{{ tpl.project_name_en }}</div>
          <div class="tile-count">{{ tpl.rooms.length }} {{ t('owner.rooms') }}</div>
        </div>
        <div v-if="selectedType.noTplRooms.length > 0"
             class="tile tile-template tile-notpl" @click="selectTemplate({ id: 'no_tpl', template_name: '未分类', rooms: selectedType.noTplRooms })">
          <div class="tile-proj-name">未分类房源</div>
          <div class="tile-count">{{ selectedType.noTplRooms.length }} {{ t('owner.rooms') }}</div>
        </div>
      </div>
    </template>

    <!-- Level 4: Room list -->
    <template v-else-if="selectedTemplate">
      <div class="breadcrumb">
        <button class="bc-btn" @click="back(1)">{{ t('room.title') }}</button>
        <span class="bc-sep">›</span>
        <button class="bc-btn" @click="back(2)">{{ selectedOwner.name }}</button>
        <span class="bc-sep">›</span>
        <button class="bc-btn" @click="back(3)">{{ t('enum.roomType.' + selectedType.type) }}</button>
        <span class="bc-sep">›</span>
        <span class="bc-cur">{{ selectedTemplate.project_name || selectedTemplate.template_name }}</span>
      </div>
      <div class="room-list-section">
        <RoomCard v-for="room in selectedTemplate.rooms" :key="room.id" :room="room"
          :is-admin="authStore.isAdmin" @delete="confirmDelete" />
      </div>
    </template>

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
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { useRoomStore } from '../stores/room.js';
import { useAuthStore } from '../stores/auth.js';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';
import SvgIcon from '../components/icons/SvgIcon.vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const store = useRoomStore();
const authStore = useAuthStore();
const toast = useToast();

// Inline RoomCard component
const RoomCard = defineComponent({
  props: { room: Object, isAdmin: Boolean },
  emits: ['delete'],
  setup(props, { emit }) {
    return () => h('div', { class: 'room-card' }, [
      h('div', { class: 'room-card-main' }, [
        h('span', { class: 'room-dot dot-' + props.room.status }),
        h('div', { class: 'room-card-info' }, [
          h(RouterLink, { to: `/rooms/${props.room.id}`, class: 'room-name' }, () => props.room.room_name_cn),
          h('span', { class: 'room-name-en' }, props.room.room_name_en),
        ]),
        h('span', { class: 'status-badge status-' + props.room.status },
          t('enum.roomStatus.' + props.room.status)),
        h('span', { class: 'room-rate' },
          Number(props.room.base_daily_rate).toLocaleString(undefined, { minimumFractionDigits: 0 }) + '/日'),
      ]),
      props.isAdmin ? h('div', { class: 'room-card-actions' }, [
        h(RouterLink, { to: `/rooms/${props.room.id}`, class: 'btn btn-sm btn-outline' }, () => t('common.edit')),
        h('button', { class: 'btn btn-sm btn-danger', onClick: () => emit('delete', props.room) }, t('common.delete')),
      ]) : null,
    ]);
  }
});

const loading = ref(false);
const ownersList = ref([]);
const templatesList = ref([]);
const deletingRoom = ref(null);

// Navigation state
const selectedOwner = ref(null);
const selectedType = ref(null);
const selectedTemplate = ref(null);

const TYPE_ICONS = { villa: '🏡', homestay: '🏠', apartment: '🏢' };
const ROOM_TYPES = ['apartment', 'villa', 'homestay'];

function selectOwner(owner) { selectedOwner.value = owner; selectedType.value = null; selectedTemplate.value = null; }
function selectType(tg) { selectedType.value = tg; selectedTemplate.value = null; }
function selectTemplate(tpl) { selectedTemplate.value = tpl; }
function back(level) {
  if (level === 1) { selectedOwner.value = null; selectedType.value = null; selectedTemplate.value = null; }
  if (level === 2) { selectedType.value = null; selectedTemplate.value = null; }
  if (level === 3) { selectedTemplate.value = null; }
}

const treeData = computed(() => {
  const rooms = store.rooms;
  return ownersList.value.map(owner => {
    const ownerRooms = rooms.filter(r => String(r.owner_id) === String(owner.id));
    const typeGroups = ROOM_TYPES.map(type => {
      const typeRooms = ownerRooms.filter(r => r.room_type === type);
      if (!typeRooms.length) return null;
      const tplMap = {};
      const noTplRooms = [];
      for (const room of typeRooms) {
        if (room.template_id) {
          if (!tplMap[room.template_id]) tplMap[room.template_id] = [];
          tplMap[room.template_id].push(room);
        } else { noTplRooms.push(room); }
      }
      const templates = templatesList.value
        .filter(tpl => String(tpl.owner_id) === String(owner.id) && tplMap[tpl.id])
        .map(tpl => ({ ...tpl, rooms: tplMap[tpl.id] || [] }));
      return { type, icon: TYPE_ICONS[type] || '🏠', templates, noTplRooms, totalRooms: typeRooms.length };
    }).filter(Boolean);
    return { ...owner, typeGroups, totalRooms: ownerRooms.length };
  }).filter(o => o.totalRooms > 0);
});

const noOwnerRooms = computed(() => store.rooms.filter(r => !r.owner_id));

function confirmDelete(room) { deletingRoom.value = room; }
async function handleDelete() {
  if (!deletingRoom.value) return;
  try {
    await store.deleteRoom(deletingRoom.value.id);
    toast.success(t('common.delete'));
    deletingRoom.value = null;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  }
}

async function loadAll() {
  loading.value = true;
  try {
    const [, ownersRes] = await Promise.all([store.fetchRooms(), apiClient.get('/owners')]);
    ownersList.value = ownersRes.data;
    const tplResults = await Promise.all(
      ownersRes.data.map(o => apiClient.get(`/owners/${o.id}/templates`).then(r => r.data).catch(() => []))
    );
    templatesList.value = tplResults.flat();
  } finally { loading.value = false; }
}

onMounted(loadAll);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }

/* Breadcrumb */
.breadcrumb {
  display: flex; align-items: center; gap: 0.375rem;
  margin-bottom: 1rem; flex-wrap: wrap;
  font-size: 0.875rem;
}
.bc-btn {
  background: none; border: none; color: #2563eb; cursor: pointer;
  padding: 0.25rem 0.375rem; border-radius: 6px; font-size: 0.875rem;
}
.bc-btn:hover { background: #eff6ff; }
.bc-sep { color: #9ca3af; }
.bc-cur { color: #374151; font-weight: 600; padding: 0.25rem 0.375rem; }

/* Card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.875rem;
}

/* Base tile */
.tile {
  border-radius: 16px; padding: 1.25rem 1rem;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; cursor: pointer; gap: 0.375rem;
  transition: transform 0.15s, box-shadow 0.15s;
  min-height: 130px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.tile:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.tile:active { transform: scale(0.97); }

/* Owner tile */
.tile-owner { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1.5px solid #bfdbfe; }
.tile-gray { background: linear-gradient(135deg, #f9fafb, #f3f4f6); border: 1.5px solid #e5e7eb; }

.tile-avatar {
  width: 3rem; height: 3rem; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-weight: 800; font-size: 1.25rem;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.25rem;
}
.tile-avatar-gray { background: #9ca3af; }

/* Type tiles */
.tile-apartment { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1.5px solid #93c5fd; }
.tile-villa { background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1.5px solid #fde047; }
.tile-homestay { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #86efac; }

.tile-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }

/* Template tile */
.tile-template {
  background: #fff; border: 1.5px solid #e5e7eb;
  align-items: flex-start; text-align: left; padding: 1.25rem;
}
.tile-template:hover { border-color: #2563eb; background: #f0f9ff; }
.tile-notpl { border-style: dashed; background: #fafafa; }

.tile-proj-name { font-weight: 700; font-size: 1rem; color: #111827; line-height: 1.3; }
.tile-name { font-weight: 700; font-size: 1rem; color: #111827; }
.tile-sub { font-size: 0.8125rem; color: #9ca3af; }
.tile-count {
  margin-top: auto; font-size: 0.8125rem; font-weight: 600;
  color: #6b7280; background: rgba(0,0,0,0.06);
  border-radius: 999px; padding: 0.125rem 0.625rem;
}

/* Room list */
.room-list-section { display: flex; flex-direction: column; gap: 0.625rem; }

.room-card {
  background: #fff; border-radius: 12px; padding: 0.875rem 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07); border: 1px solid #f3f4f6;
}
.room-card-main {
  display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;
}
.room-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.125rem; }
.room-card-actions { display: flex; gap: 0.5rem; margin-top: 0.625rem; padding-top: 0.625rem; border-top: 1px solid #f3f4f6; }

.room-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-active { background: #22c55e; }
.dot-maintenance { background: #f59e0b; }

.room-name { color: #2563eb; font-weight: 600; font-size: 1rem; text-decoration: none; }
.room-name:hover { text-decoration: underline; }
.room-name-en { color: #9ca3af; font-size: 0.8125rem; }
.room-rate { font-size: 0.875rem; color: #374151; font-weight: 500; margin-left: auto; white-space: nowrap; }

.status-badge {
  font-size: 0.75rem; padding: 0.2rem 0.6rem;
  border-radius: 999px; font-weight: 600; white-space: nowrap;
}
.status-active { background: #dcfce7; color: #166534; }
.status-maintenance { background: #fef9c3; color: #854d0e; }

.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; border-radius: 8px; }
.btn-danger { background: #ef4444; color: #fff; border: none; }
.btn-danger:hover { background: #dc2626; }
</style>
