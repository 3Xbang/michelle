<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.customers.title') }}</h1>
      <div class="header-actions">
        <button v-if="authStore.isAdmin && pendingCount > 0" class="btn btn-outline btn-sm pending-badge" @click="router.push('/sales/customers/pending')">
          {{ t('sales.customers.pending') }} <span class="badge">{{ pendingCount }}</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="router.push('/sales/customers/new')">+ {{ t('sales.customers.create') }}</button>
      </div>
    </div>

    <div class="filter-bar">
      <input v-model="search" class="form-input search-input" :placeholder="t('sales.customers.searchPlaceholder')" @input="debouncedLoad" />
      <select v-if="authStore.isAdmin" v-model="filters.salesperson_id" class="form-select" @change="load">
        <option value="">{{ t('sales.customers.allSalespersons') }}</option>
        <option v-for="u in salespersons" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <select v-model="filters.source" class="form-select" @change="load">
        <option value="">{{ t('sales.customers.allSources') }}</option>
        <option value="walk_in">{{ t('sales.customers.source.walk_in') }}</option>
        <option value="referral">{{ t('sales.customers.source.referral') }}</option>
        <option value="online_ad">{{ t('sales.customers.source.online_ad') }}</option>
        <option value="agent">{{ t('sales.customers.source.agent') }}</option>
        <option value="web_form">{{ t('sales.customers.source.web_form') }}</option>
        <option value="other">{{ t('sales.customers.source.other') }}</option>
      </select>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.customers.length === 0" class="empty-text">{{ t('sales.customers.noData') }}</div>

    <div v-else class="card-grid">
      <div v-for="c in store.customers" :key="c.id" class="customer-card" @click="router.push(`/sales/customers/${c.id}`)">
        <div class="customer-avatar">{{ c.name?.charAt(0) || '?' }}</div>
        <div class="customer-body">
          <div class="customer-name">{{ c.name }}</div>
          <div class="customer-phone">{{ c.phone }}</div>
          <div class="customer-meta">
            <span class="source-badge">{{ t('sales.customers.source.' + (c.lead_source || 'other')) }}</span>
          </div>
          <div v-if="c.salesperson_name" class="customer-sales">{{ t('sales.customers.salesperson') }}：{{ c.salesperson_name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesCustomerStore } from '../../stores/salesCustomer.js';
import { useAuthStore } from '../../stores/auth.js';
import apiClient from '../../api/client.js';

const { t } = useI18n();
const router = useRouter();
const store = useSalesCustomerStore();
const authStore = useAuthStore();

const search = ref('');
const filters = reactive({ salesperson_id: '', source: '' });
const salespersons = ref([]);
const pendingCount = ref(0);

let debounceTimer = null;
function debouncedLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
}

function load() {
  const f = {};
  if (search.value) f.q = search.value;
  if (filters.salesperson_id) f.salesperson_id = filters.salesperson_id;
  if (filters.source) f.lead_source = filters.source;
  store.fetchCustomers(f);
}

onMounted(async () => {
  load();
  if (authStore.isAdmin) {
    try {
      const usersRes = await apiClient.get('/users');
      salespersons.value = usersRes.data.filter(u => u.role !== 'Admin');
      await store.fetchPending();
      pendingCount.value = store.pendingCustomers.length;
    } catch { /* ignore */ }
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.header-actions { display: flex; gap: 0.625rem; align-items: center; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.pending-badge { position: relative; }
.badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: #ef4444; color: #fff; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; min-width: 18px; height: 18px;
  padding: 0 4px; margin-left: 4px;
}

.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.search-input { flex: 1; min-width: 180px; }
.form-input {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; font-size: 0.875rem; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
}
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

.customer-card {
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 14px; padding: 1rem; cursor: pointer;
  display: flex; gap: 0.875rem; align-items: flex-start;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.customer-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

.customer-avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-weight: 800; font-size: 1.125rem;
  display: flex; align-items: center; justify-content: center;
}
.customer-body { flex: 1; min-width: 0; }
.customer-name { font-weight: 700; font-size: 0.9375rem; color: var(--color-text-primary, #111827); margin-bottom: 0.2rem; }
.customer-phone { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.375rem; }
.customer-meta { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
.customer-sales { font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); }

.source-badge, .level-badge {
  font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px;
}
.source-badge { background: #f3f4f6; color: #374151; }
.level-cold { background: #dbeafe; color: #1d4ed8; }
.level-warm { background: #fef9c3; color: #854d0e; }
.level-hot { background: #fee2e2; color: #991b1b; }
.level-signed { background: #dcfce7; color: #166534; }
</style>
