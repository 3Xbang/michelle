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

    <!-- Owner level -->
    <div v-for="owner in treeData" :key="'o' + owner.id" class="tree-owner card">
      <div class="tree-row owner-row" @click="toggleOwner(owner.id)">
        <span class="tree-arrow" :class="{ open: expandedOwners.has(owner.id) }">▶</span>
        <span class="owner-avatar">{{ owner.name.charAt(0) }}</span>
        <div class="tree-label">
          <span class="owner-name">{{ owner.name }}</span>
          <span v-if="owner.name_en" class="sub-label">{{ owner.name_en }}</span>
        </div>
        <span class="tree-badge">{{ owner.totalRooms }} {{ t('owner.rooms') }}</span>
      </div>

      <!-- Type level (公寓/别墅/民宿) -->
      <div v-if="expandedOwners.has(owner.id)" class="tree-children">
        <div v-for="typeGroup in owner.typeGroups" :key="'ty_' + owner.id + '_' + typeGroup.type" class="tree-type">
          <div class="tree-row type-row" @click="toggleType(owner.id + '_' + typeGroup.type)">
            <span class="tree-arrow" :class="{ open: expandedTypes.has(owner.id + '_' + typeGroup.type) }">▶</span>
            <span class="type-icon">{{ typeGroup.icon }}</span>
            <span class="project-type-badge" :class="'type-' + typeGroup.type">
              {{ t('enum.roomType.' + typeGroup.type) }}
            </span>
            <span class="tree-badge" style="margin-left:auto">{{ typeGroup.totalRooms }} {{ t('owner.rooms') }}</span>
          </div>

          <!-- Template level -->
          <div v-if="expandedTypes.has(owner.id + '_' + typeGroup.type)" class="tree-children">
            <div v-for="tpl in typeGroup.templates" :key="'t' + tpl.id" class="tree-template">
              <div class="tree-row template-row" @click="toggleTemplate(tpl.id)">
                <span class="tree-arrow" :class="{ open: expandedTemplates.has(tpl.id) }">▶</span>
                <div class="tree-label">
                  <span class="tpl-name">{{ tpl.project_name || tpl.template_name }}</span>
                  <span v-if="tpl.project_name_en" class="sub-label">{{ tpl.project_name_en }}</span>
                </div>
                <span class="tree-badge">{{ tpl.rooms.length }} {{ t('owner.rooms') }}</span>
              </div>
              <!-- Room level -->
              <div v-if="expandedTemplates.has(tpl.id)" class="tree-rooms">
                <div v-for="room in tpl.rooms" :key="'r' + room.id" class="room-row">
                  <span class="room-dot" :class="'dot-' + room.status"></span>
                  <router-link :to="`/rooms/${room.id}`" class="room-name">{{ room.room_name_cn }}</router-link>
                  <span class="room-name-en">{{ room.room_name_en }}</span>
                  <span class="room-rate">{{ formatNum(room.base_daily_rate) }}/日</span>
                  <span class="status-badge" :class="'status-' + room.status">{{ t('enum.roomStatus.' + room.status) }}</span>
                  <div v-if="authStore.isAdmin" class="room-actions">
                    <router-link :to="`/rooms/${room.id}`" class="btn btn-xs btn-outline">{{ t('common.edit') }}</router-link>
                    <button class="btn btn-xs btn-danger" @click.stop="confirmDelete(room)">{{ t('common.delete') }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No-template rooms under this type -->
            <div v-if="typeGroup.noTplRooms.length > 0" class="tree-template">
              <div class="tree-row template-row" @click="toggleTemplate('nt_' + owner.id + '_' + typeGroup.type)">
                <span class="tree-arrow" :class="{ open: expandedTemplates.has('nt_' + owner.id + '_' + typeGroup.type) }">▶</span>
                <div class="tree-label"><span class="tpl-name">未分类</span></div>
                <span class="tree-badge">{{ typeGroup.noTplRooms.length }} {{ t('owner.rooms') }}</span>
              </div>
              <div v-if="expandedTemplates.has('nt_' + owner.id + '_' + typeGroup.type)" class="tree-rooms">
                <div v-for="room in typeGroup.noTplRooms" :key="'r' + room.id" class="room-row">
                  <span class="room-dot" :class="'dot-' + room.status"></span>
                  <router-link :to="`/rooms/${room.id}`" class="room-name">{{ room.room_name_cn }}</router-link>
                  <span class="room-name-en">{{ room.room_name_en }}</span>
                  <span class="room-rate">{{ formatNum(room.base_daily_rate) }}/日</span>
                  <span class="status-badge" :class="'status-' + room.status">{{ t('enum.roomStatus.' + room.status) }}</span>
                  <div v-if="authStore.isAdmin" class="room-actions">
                    <router-link :to="`/rooms/${room.id}`" class="btn btn-xs btn-outline">{{ t('common.edit') }}</router-link>
                    <button class="btn btn-xs btn-danger" @click.stop="confirmDelete(room)">{{ t('common.delete') }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No-owner rooms -->
    <div v-if="noOwnerRooms.length > 0" class="tree-owner card">
      <div class="tree-row owner-row" @click="toggleOwner('no_owner')">
        <span class="tree-arrow" :class="{ open: expandedOwners.has('no_owner') }">▶</span>
        <span class="owner-avatar owner-avatar-gray">?</span>
        <div class="tree-label"><span class="owner-name">未分配业主</span></div>
        <span class="tree-badge">{{ noOwnerRooms.length }} {{ t('owner.rooms') }}</span>
      </div>
      <div v-if="expandedOwners.has('no_owner')" class="tree-rooms" style="padding-left:1.25rem">
        <div v-for="room in noOwnerRooms" :key="'r' + room.id" class="room-row">
          <span class="room-dot" :class="'dot-' + room.status"></span>
          <router-link :to="`/rooms/${room.id}`" class="room-name">{{ room.room_name_cn }}</router-link>
          <span class="room-name-en">{{ room.room_name_en }}</span>
          <span class="room-rate">{{ formatNum(room.base_daily_rate) }}/日</span>
          <span class="status-badge" :class="'status-' + room.status">{{ t('enum.roomStatus.' + room.status) }}</span>
          <div v-if="authStore.isAdmin" class="room-actions">
            <router-link :to="`/rooms/${room.id}`" class="btn btn-xs btn-outline">{{ t('common.edit') }}</router-link>
            <button class="btn btn-xs btn-danger" @click.stop="confirmDelete(room)">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
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
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const loading = ref(false);
const ownersList = ref([]);
const templatesList = ref([]);
const expandedOwners = ref(new Set());
const expandedTypes = ref(new Set());
const expandedTemplates = ref(new Set());
const deletingRoom = ref(null);

const TYPE_ICONS = { villa: '🏡', homestay: '🏠', apartment: '🏢' };
const ROOM_TYPES = ['apartment', 'villa', 'homestay'];

function toggleOwner(id) {
  const s = new Set(expandedOwners.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedOwners.value = s;
}
function toggleType(key) {
  const s = new Set(expandedTypes.value);
  s.has(key) ? s.delete(key) : s.add(key);
  expandedTypes.value = s;
}
function toggleTemplate(id) {
  const s = new Set(expandedTemplates.value);
  s.has(id) ? s.delete(id) : s.add(id);
  expandedTemplates.value = s;
}

const treeData = computed(() => {
  const rooms = store.rooms;
  return ownersList.value.map(owner => {
    const ownerRooms = rooms.filter(r => String(r.owner_id) === String(owner.id));

    // Build type groups
    const typeGroups = ROOM_TYPES.map(type => {
      const typeRooms = ownerRooms.filter(r => r.room_type === type);
      if (typeRooms.length === 0) return null;

      // Group by template
      const tplMap = {};
      const noTplRooms = [];
      for (const room of typeRooms) {
        if (room.template_id) {
          if (!tplMap[room.template_id]) tplMap[room.template_id] = [];
          tplMap[room.template_id].push(room);
        } else {
          noTplRooms.push(room);
        }
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

function formatNum(v) {
  if (!v) return '0';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

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
  } finally {
    loading.value = false;
  }
}

onMounted(loadAll);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }

.tree-owner { margin-bottom: 0.75rem; padding: 0; overflow: hidden; }

.tree-row {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.875rem 1.25rem; cursor: pointer; user-select: none;
  transition: background 0.15s;
}

.owner-row { background: #fff; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.owner-row:hover { background: #f0f9ff; }

.type-row {
  padding: 0.625rem 1.25rem 0.625rem 2.5rem;
  background: #f8fafc; border-bottom: 1px solid #f1f5f9;
}
.type-row:hover { background: #eff6ff; }

.template-row {
  padding: 0.5rem 1.25rem 0.5rem 4rem;
  background: #fafafa; border-bottom: 1px solid #f3f4f6;
}
.template-row:hover { background: #f0f9ff; }

.tree-arrow {
  font-size: 0.625rem; color: #9ca3af;
  transition: transform 0.2s; display: inline-block; width: 12px; flex-shrink: 0;
}
.tree-arrow.open { transform: rotate(90deg); color: #2563eb; }

.owner-avatar {
  width: 2rem; height: 2rem; border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-weight: 700; font-size: 0.875rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.owner-avatar-gray { background: #9ca3af; }

.type-icon { font-size: 1.125rem; flex-shrink: 0; }

.tree-label { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.owner-name { font-weight: 700; font-size: 1rem; }
.tpl-name { font-weight: 600; font-size: 0.9375rem; }
.sub-label { font-size: 0.8125rem; color: #9ca3af; }

.tree-badge {
  font-size: 0.75rem; color: #6b7280;
  background: #f3f4f6; border-radius: 999px;
  padding: 0.125rem 0.5rem; flex-shrink: 0; white-space: nowrap;
}

.project-type-badge {
  display: inline-block; padding: 0.15rem 0.5rem;
  border-radius: 4px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.type-apartment { background: #dbeafe; color: #1d4ed8; }
.type-homestay { background: #dcfce7; color: #166534; }
.type-villa { background: #fef9c3; color: #854d0e; }
.type-other { background: #f3f4f6; color: #6b7280; }

.tree-children { }
.tree-type { border-bottom: 1px solid #f1f5f9; }
.tree-type:last-child { border-bottom: none; }
.tree-template { border-bottom: 1px solid #f3f4f6; }
.tree-template:last-child { border-bottom: none; }

.tree-rooms { }
.room-row {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.5rem 1.25rem 0.5rem 5.5rem;
  border-bottom: 1px solid #f9fafb; flex-wrap: wrap;
}
.room-row:last-child { border-bottom: none; }
.room-row:hover { background: #fafafa; }

.room-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-active { background: #22c55e; }
.dot-maintenance { background: #f59e0b; }

.room-name { color: #2563eb; font-weight: 500; font-size: 0.9375rem; text-decoration: none; }
.room-name:hover { text-decoration: underline; }
.room-name-en { color: #9ca3af; font-size: 0.8125rem; }
.room-rate { font-size: 0.8125rem; color: #374151; margin-left: auto; white-space: nowrap; }

.status-badge {
  font-size: 0.75rem; padding: 0.125rem 0.5rem;
  border-radius: 999px; font-weight: 500; white-space: nowrap;
}
.status-active { background: #dcfce7; color: #166534; }
.status-maintenance { background: #fef9c3; color: #854d0e; }

.room-actions { display: flex; gap: 0.375rem; }
.btn-xs { padding: 0.125rem 0.5rem; font-size: 0.75rem; }
.btn-danger { background: #ef4444; color: #fff; border: none; }
.btn-danger:hover { background: #dc2626; }
</style>
