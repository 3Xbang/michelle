<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.adMaterials.title') }}</h1>
      <button class="btn btn-primary btn-sm" @click="goNew">+ {{ t('sales.adMaterials.create') }}</button>
    </div>

    <div class="filter-bar">
      <select v-model="filters.ad_status" class="form-select" @change="load">
        <option value="">{{ t('common.all') }}</option>
        <option value="draft">{{ t('sales.adMaterials.status.draft') }}</option>
        <option value="published">{{ t('sales.adMaterials.status.published') }}</option>
        <option value="paused">{{ t('sales.adMaterials.status.paused') }}</option>
      </select>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.materials.length === 0" class="empty-text">{{ t('sales.adMaterials.noData') }}</div>

    <div v-else class="card-grid">
      <div v-for="m in store.materials" :key="m.id" class="ad-card">
        <div class="ad-card-header">
          <span class="ad-title">{{ m.title }}</span>
          <span class="status-badge" :class="'ad-' + m.ad_status">{{ t('sales.adMaterials.status.' + m.ad_status) }}</span>
        </div>
        <div v-if="m.description" class="ad-desc">{{ m.description }}</div>
        <div class="ad-actions">
          <button class="btn btn-xs btn-outline" @click="router.push(`/sales/ad-materials/${m.id}/preview`)">{{ t('sales.adMaterials.preview') }}</button>
          <button class="btn btn-xs btn-outline" @click="router.push(`/sales/ad-materials/${m.id}/edit`)">{{ t('common.edit') }}</button>
          <button class="btn btn-xs" :class="m.ad_status === 'published' ? 'btn-warning' : 'btn-success'" @click="toggleStatus(m)">
            {{ m.ad_status === 'published' ? t('sales.adMaterials.status.paused') : t('sales.adMaterials.status.published') }}
          </button>
          <button class="btn btn-xs btn-danger" @click="confirmDel(m)">{{ t('common.delete') }}</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="!!deleting"
      :title="t('common.confirmDelete')"
      :message="deleting?.title"
      @confirm="handleDelete"
      @cancel="deleting = null"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdMaterialStore } from '../../stores/adMaterial.js';
import { useToast } from '../../composables/useToast.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAdMaterialStore();
const toast = useToast();

const filters = reactive({ ad_status: '' });
const deleting = ref(null);

function goNew() {
  const q = route.query.property_id ? `?property_id=${route.query.property_id}` : '';
  router.push(`/sales/ad-materials/new${q}`);
}

function load() {
  const f = {};
  if (route.query.property_id) f.property_id = route.query.property_id;
  if (filters.ad_status) f.ad_status = filters.ad_status;
  store.fetchMaterials(f);
}

async function toggleStatus(m) {
  const next = m.ad_status === 'published' ? 'paused' : 'published';
  try {
    await store.updateStatus(m.id, next);
    toast.success(t('common.save'));
  } catch { toast.error(t('error.unknown')); }
}

function confirmDel(m) { deleting.value = m; }
async function handleDelete() {
  if (!deleting.value) return;
  try {
    await store.deleteMaterial(deleting.value.id);
    toast.success(t('common.delete'));
    deleting.value = null;
  } catch { toast.error(t('error.unknown')); }
}

onMounted(load);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.form-select {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827); font-size: 0.875rem; cursor: pointer;
}

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

.ad-card {
  background: var(--color-surface, #fff); border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 12px; padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.ad-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.5rem; }
.ad-title { font-weight: 700; font-size: 0.9375rem; color: var(--color-text-primary, #111827); flex: 1; }
.ad-desc { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.75rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ad-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; }

.status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; white-space: nowrap; }
.ad-draft { background: #f3f4f6; color: #6b7280; }
.ad-published { background: #dcfce7; color: #166534; }
.ad-paused { background: #fef9c3; color: #854d0e; }

.btn-xs { padding: 0.25rem 0.625rem; font-size: 0.75rem; border-radius: 6px; border: 1.5px solid transparent; cursor: pointer; }
.btn-danger { background: #ef4444; color: #fff; border-color: #ef4444; }
.btn-danger:hover { background: #dc2626; }
.btn-warning { background: #f59e0b; color: #fff; border-color: #f59e0b; }
.btn-warning:hover { background: #d97706; }
.btn-success { background: #22c55e; color: #fff; border-color: #22c55e; }
.btn-success:hover { background: #16a34a; }
</style>
