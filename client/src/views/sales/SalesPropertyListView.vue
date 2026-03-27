<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.properties.title') }}</h1>
      <button class="btn btn-primary btn-icon" @click="router.push('/sales/properties/new')">
        + {{ t('sales.properties.create') }}
      </button>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" class="form-select" @change="load">
        <option value="">{{ t('sales.properties.allStatus') }}</option>
        <option value="available">{{ t('sales.properties.status.available') }}</option>
        <option value="reserved">{{ t('sales.properties.status.reserved') }}</option>
        <option value="sold">{{ t('sales.properties.status.sold') }}</option>
      </select>
      <select v-model="filters.property_type" class="form-select" @change="load">
        <option value="">{{ t('sales.properties.allTypes') }}</option>
        <option value="own">{{ t('sales.properties.type.own') }}</option>
        <option value="external">{{ t('sales.properties.type.external') }}</option>
      </select>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.properties.length === 0" class="empty-text">{{ t('sales.properties.noData') }}</div>

    <div v-else class="card-grid">
      <div
        v-for="p in store.properties"
        :key="p.id"
        class="prop-card"
        @click="router.push(`/sales/properties/${p.id}`)"
      >
        <div class="prop-cover">
          <img v-if="coverPhoto(p)" :src="coverPhoto(p)" class="prop-cover-img" />
          <div v-else class="prop-cover-placeholder">🏠</div>
        </div>
        <div class="prop-body">
          <div class="prop-name">{{ p.name }}</div>
          <div class="prop-meta">
            <span>{{ p.unit_type }}</span>
            <span v-if="p.area_sqm">{{ p.area_sqm }}㎡</span>
          </div>
          <div class="prop-price">¥{{ formatNum(p.price) }}</div>
          <div class="prop-footer">
            <span class="status-badge" :class="'status-' + p.status">{{ t('sales.properties.status.' + p.status) }}</span>
            <span class="type-badge" :class="'type-' + p.property_type">{{ t('sales.properties.type.' + p.property_type) }}</span>
          </div>
          <div v-if="authStore.isAdmin" class="prop-actions" @click.stop>
            <button class="btn btn-xs btn-danger" @click="confirmDel(p)">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="!!deleting"
      :title="t('common.confirmDelete')"
      :message="deleting?.name"
      @confirm="handleDelete"
      @cancel="deleting = null"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesPropertyStore } from '../../stores/salesProperty.js';
import { useAuthStore } from '../../stores/auth.js';
import { useToast } from '../../composables/useToast.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const router = useRouter();
const store = useSalesPropertyStore();
const authStore = useAuthStore();
const toast = useToast();

const filters = reactive({ status: '', property_type: '' });
const deleting = ref(null);

function coverPhoto(p) {
  if (!p.photos?.length) return null;
  const cover = p.photos.find(ph => ph.is_cover);
  return cover ? cover.url : p.photos[0].url;
}

function formatNum(v) {
  if (!v) return '0';
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function confirmDel(p) { deleting.value = p; }
async function handleDelete() {
  if (!deleting.value) return;
  try {
    await store.deleteProperty(deleting.value.id);
    toast.success(t('common.delete'));
    deleting.value = null;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  }
}

function load() {
  const f = {};
  if (filters.status) f.status = filters.status;
  if (filters.property_type) f.property_type = filters.property_type;
  store.fetchProperties(f);
}

onMounted(load);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }

.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.form-select {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827); font-size: 0.875rem; cursor: pointer;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.prop-card {
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 14px; overflow: hidden; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.prop-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

.prop-cover { height: 130px; background: #f3f4f6; overflow: hidden; }
.prop-cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.prop-cover-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }

.prop-body { padding: 0.875rem; }
.prop-name { font-weight: 700; font-size: 0.9375rem; color: var(--color-text-primary, #111827); margin-bottom: 0.25rem; }
.prop-meta { display: flex; gap: 0.5rem; font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.375rem; }
.prop-price { font-size: 1rem; font-weight: 800; color: #2563eb; margin-bottom: 0.5rem; }
.prop-footer { display: flex; gap: 0.375rem; flex-wrap: wrap; }

.status-badge, .type-badge {
  font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem;
  border-radius: 999px;
}
.status-available { background: #dcfce7; color: #166534; }
.status-reserved { background: #fef9c3; color: #854d0e; }
.status-sold { background: #fee2e2; color: #991b1b; }
.type-own { background: #dbeafe; color: #1d4ed8; }
.type-external { background: #f3e8ff; color: #6b21a8; }

.prop-actions { margin-top: 0.625rem; padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.06); }
.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; border-radius: 6px; }
.btn-danger { background: #ef4444; color: #fff; border: none; cursor: pointer; }
.btn-danger:hover { background: #dc2626; }
</style>
