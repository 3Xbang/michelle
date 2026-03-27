<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.intents.title') }}</h1>
      <button class="btn btn-primary btn-sm" @click="router.push('/sales/intents/new')">+ {{ t('sales.intents.create') }}</button>
    </div>

    <div class="filter-bar">
      <select v-model="filters.intent_level" class="form-select" @change="load">
        <option value="">{{ t('sales.intents.allLevels') }}</option>
        <option value="cold">{{ t('sales.intents.level.cold') }}</option>
        <option value="warm">{{ t('sales.intents.level.warm') }}</option>
        <option value="hot">{{ t('sales.intents.level.hot') }}</option>
        <option value="signed">{{ t('sales.intents.level.signed') }}</option>
      </select>
      <select v-if="authStore.isAdmin" v-model="filters.salesperson_id" class="form-select" @change="load">
        <option value="">{{ t('sales.customers.allSalespersons') }}</option>
        <option v-for="u in salespersons" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.intents.length === 0" class="empty-text">{{ t('sales.intents.noData') }}</div>

    <div v-else class="intent-list">
      <div v-for="intent in store.intents" :key="intent.id" class="intent-item card" @click="router.push(`/sales/intents/${intent.id}`)">
        <div class="intent-main">
          <div class="intent-names">
            <span class="intent-customer">{{ intent.customer_name }}</span>
            <span class="intent-sep">→</span>
            <span class="intent-property">{{ intent.property_name }}</span>
          </div>
          <span class="level-badge" :class="'level-' + intent.intent_level">{{ t('sales.intents.level.' + intent.intent_level) }}</span>
        </div>
        <div class="intent-meta">
          <span>{{ t('sales.intents.lastFollowUp') }}：{{ formatDate(intent.last_follow_up_at) }}</span>
          <span v-if="intent.salesperson_name">{{ t('sales.customers.salesperson') }}：{{ intent.salesperson_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePurchaseIntentStore } from '../../stores/purchaseIntent.js';
import { useAuthStore } from '../../stores/auth.js';
import apiClient from '../../api/client.js';

const { t } = useI18n();
const router = useRouter();
const store = usePurchaseIntentStore();
const authStore = useAuthStore();

const filters = reactive({ intent_level: '', salesperson_id: '' });
const salespersons = ref([]);

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function load() {
  const f = {};
  if (filters.intent_level) f.intent_level = filters.intent_level;
  if (filters.salesperson_id) f.salesperson_id = filters.salesperson_id;
  store.fetchIntents(f);
}

onMounted(async () => {
  load();
  if (authStore.isAdmin) {
    try {
      const { data } = await apiClient.get('/users');
      salespersons.value = data.filter(u => u.role !== 'Admin');
    } catch { /* ignore */ }
  }
});
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

.intent-list { display: flex; flex-direction: column; gap: 0.75rem; }
.intent-item {
  padding: 1rem 1.25rem; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.intent-item:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.intent-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.375rem; }
.intent-names { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.intent-customer { font-weight: 700; color: var(--color-text-primary, #111827); }
.intent-sep { color: var(--color-text-secondary, #9ca3af); }
.intent-property { font-weight: 600; color: #2563eb; }
.intent-meta { display: flex; gap: 1rem; font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); flex-wrap: wrap; }

.level-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; }
.level-cold { background: #dbeafe; color: #1d4ed8; }
.level-warm { background: #fef9c3; color: #854d0e; }
.level-hot { background: #fee2e2; color: #991b1b; }
.level-signed { background: #dcfce7; color: #166534; }
</style>
