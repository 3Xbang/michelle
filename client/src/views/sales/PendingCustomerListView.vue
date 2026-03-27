<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.customers.pendingTitle') }}</h1>
      <button class="btn btn-outline btn-sm" @click="router.back()">← {{ t('common.back') }}</button>
    </div>

    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.pendingCustomers.length === 0" class="empty-text">{{ t('sales.customers.noData') }}</div>

    <div v-else class="pending-list">
      <div v-for="c in store.pendingCustomers" :key="c.id" class="pending-item card">
        <div class="pending-info">
          <div class="pending-name">{{ c.name }}</div>
          <div class="pending-phone">{{ c.phone }}</div>
          <div v-if="c.wechat" class="pending-meta">{{ t('sales.customers.fields.wechat') }}：{{ c.wechat }}</div>
          <div v-if="c.budget_min || c.budget_max" class="pending-meta">{{ t('sales.inquiry.fields.budgetRange') }}：{{ budgetText(c) }}</div>
          <div v-if="c.notes" class="pending-notes">{{ c.notes }}</div>
        </div>
        <div class="pending-action">
          <select v-model="assignMap[c.id]" class="form-select">
            <option value="">{{ t('sales.customers.assignTo') }}</option>
            <option v-for="u in salespersons" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <button class="btn btn-primary btn-sm" :disabled="!assignMap[c.id] || assigning[c.id]" @click="handleAssign(c.id)">
            {{ assigning[c.id] ? t('common.loading') : t('sales.customers.assign') }}
          </button>
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
import { useToast } from '../../composables/useToast.js';
import apiClient from '../../api/client.js';

const { t } = useI18n();
const router = useRouter();
const store = useSalesCustomerStore();
const toast = useToast();

const loading = ref(false);
const salespersons = ref([]);
const assignMap = reactive({});
const assigning = reactive({});

function budgetText(c) {
  const fmt = v => Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (c.budget_min && c.budget_max) return `¥${fmt(c.budget_min)} ~ ¥${fmt(c.budget_max)}`;
  if (c.budget_min) return `¥${fmt(c.budget_min)}+`;
  if (c.budget_max) return `≤¥${fmt(c.budget_max)}`;
  return '-';
}

async function handleAssign(customerId) {
  const salespersonId = assignMap[customerId];
  if (!salespersonId) return;
  assigning[customerId] = true;
  try {
    await store.assignCustomer(customerId, salespersonId);
    toast.success(t('sales.customers.assign'));
    delete assignMap[customerId];
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    assigning[customerId] = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const [, usersRes] = await Promise.all([store.fetchPending(), apiClient.get('/users')]);
    salespersons.value = usersRes.data.filter(u => u.role !== 'Admin');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.pending-list { display: flex; flex-direction: column; gap: 0.875rem; }
.pending-item { padding: 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.pending-info { flex: 1; min-width: 0; }
.pending-name { font-weight: 700; font-size: 1rem; color: var(--color-text-primary, #111827); margin-bottom: 0.2rem; }
.pending-phone { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem; }
.pending-meta { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.pending-notes { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-top: 0.375rem; }

.pending-action { display: flex; gap: 0.625rem; align-items: center; flex-wrap: wrap; }
.form-select {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827); font-size: 0.875rem; cursor: pointer;
}
</style>
