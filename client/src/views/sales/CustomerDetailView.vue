<template>
  <div>
    <div class="page-header">
      <button class="btn btn-outline btn-sm" @click="router.back()">← {{ t('common.back') }}</button>
      <button class="btn btn-primary btn-sm" @click="router.push(`/sales/customers/${route.params.id}/edit`)">{{ t('common.edit') }}</button>
    </div>

    <div v-if="!customer" class="loading-text">{{ t('common.loading') }}</div>
    <template v-else>
      <div class="card info-card">
        <div class="customer-header">
          <div class="customer-avatar">{{ customer.name?.charAt(0) || '?' }}</div>
          <div>
            <div class="customer-name">{{ customer.name }}</div>
            <div class="customer-phone">{{ customer.phone }}</div>
            <div v-if="customer.wechat" class="customer-wechat">{{ t('sales.customers.fields.wechat') }}：{{ customer.wechat }}</div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">{{ t('sales.customers.fields.leadSource') }}</span><span>{{ t('sales.customers.source.' + (customer.lead_source || 'other')) }}</span></div>
          <div class="info-item"><span class="info-label">{{ t('sales.inquiry.fields.budgetRange') }}</span><span>{{ budgetText }}</span></div>
          <div v-if="customer.salesperson_name" class="info-item"><span class="info-label">{{ t('sales.customers.fields.salesperson') }}</span><span>{{ customer.salesperson_name }}</span></div>
        </div>
        <div v-if="customer.preferences" class="info-notes"><span class="info-label">{{ t('sales.customers.fields.preferences') }}：</span>{{ customer.preferences }}</div>
        <div v-if="customer.notes" class="info-notes"><span class="info-label">{{ t('sales.customers.fields.notes') }}：</span>{{ customer.notes }}</div>
      </div>

      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'viewings'">
        <div class="tab-header">
          <span class="tab-count">{{ viewings.length }}</span>
          <button class="btn btn-primary btn-sm" @click="router.push({ path: '/sales/viewing-records/new', query: { customer_id: customer.id } })">+ {{ t('sales.viewingRecords.create') }}</button>
        </div>
        <div v-if="viewings.length === 0" class="empty-text">{{ t('sales.viewingRecords.noData') }}</div>
        <div v-else class="record-list">
          <div v-for="v in viewings" :key="v.id" class="record-item">
            <div class="record-main">
              <span class="record-name">{{ v.property_name }}</span>
              <span class="record-time">{{ formatDate(v.viewed_at) }}</span>
            </div>
            <div v-if="v.notes" class="record-notes">{{ v.notes }}</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'intents'">
        <div class="tab-header">
          <span class="tab-count">{{ intents.length }}</span>
          <button class="btn btn-primary btn-sm" @click="router.push({ path: '/sales/intents/new', query: { customer_id: customer.id } })">+ {{ t('sales.intents.create') }}</button>
        </div>
        <div v-if="intents.length === 0" class="empty-text">{{ t('sales.intents.noData') }}</div>
        <div v-else class="record-list">
          <div v-for="intent in intents" :key="intent.id" class="record-item" @click="router.push(`/sales/intents/${intent.id}`)">
            <div class="record-main">
              <span class="record-name">{{ intent.property_name }}</span>
              <span class="level-badge" :class="'level-' + intent.intent_level">{{ t('sales.intents.level.' + intent.intent_level) }}</span>
            </div>
            <div class="record-time">{{ t('sales.intents.lastFollowUp') }}：{{ formatDate(intent.last_follow_up_at) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesCustomerStore } from '../../stores/salesCustomer.js';
import { viewingRecordsApi, intentsApi } from '../../api/sales.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useSalesCustomerStore();

const customer = ref(null);
const activeTab = ref('viewings');
const viewings = ref([]);
const intents = ref([]);

const tabs = computed(() => [
  { key: 'viewings', label: t('sales.customers.tabs.viewings') },
  { key: 'intents', label: t('sales.customers.tabs.intents') },
]);

const budgetText = computed(() => {
  const c = customer.value;
  if (!c) return '-';
  if (c.budget_min && c.budget_max) return `¥${fmt(c.budget_min)} ~ ¥${fmt(c.budget_max)}`;
  if (c.budget_min) return `¥${fmt(c.budget_min)}+`;
  if (c.budget_max) return `≤¥${fmt(c.budget_max)}`;
  return '-';
});

function fmt(v) { return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function switchTab(key) {
  activeTab.value = key;
  const id = route.params.id;
  if (key === 'viewings' && viewings.value.length === 0) {
    const { data } = await viewingRecordsApi.list({ customer_id: id });
    viewings.value = data.sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));
  }
  if (key === 'intents' && intents.value.length === 0) {
    const { data } = await intentsApi.list({ customer_id: id });
    const order = { signed: 4, hot: 3, warm: 2, cold: 1 };
    intents.value = data.sort((a, b) => (order[b.intent_level] || 0) - (order[a.intent_level] || 0));
  }
}

onMounted(async () => {
  customer.value = await store.fetchCustomer(route.params.id);
  await switchTab('viewings');
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.info-card { padding: 1.25rem; margin-bottom: 1rem; }
.customer-header { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
.customer-avatar {
  width: 3rem; height: 3rem; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff; font-weight: 800; font-size: 1.25rem;
  display: flex; align-items: center; justify-content: center;
}
.customer-name { font-size: 1.125rem; font-weight: 800; color: var(--color-text-primary, #111827); }
.customer-phone { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }
.customer-wechat { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.info-label { font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); }
.info-notes { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); margin-top: 0.5rem; }

.tabs { display: flex; border-bottom: 2px solid var(--color-border, #e5e7eb); margin-bottom: 1rem; }
.tab-btn {
  padding: 0.625rem 1.25rem; font-size: 0.9375rem; font-weight: 600;
  background: none; border: none; cursor: pointer; color: var(--color-text-secondary, #6b7280);
  border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

.tab-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.tab-count { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }

.record-list { display: flex; flex-direction: column; gap: 0.625rem; }
.record-item {
  background: var(--color-surface, #fff); border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 10px; padding: 0.875rem; cursor: pointer; transition: box-shadow 0.15s;
}
.record-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.record-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.record-name { font-weight: 600; color: var(--color-text-primary, #111827); }
.record-time { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.record-notes { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.level-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; }
.level-cold { background: #dbeafe; color: #1d4ed8; }
.level-warm { background: #fef9c3; color: #854d0e; }
.level-hot { background: #fee2e2; color: #991b1b; }
.level-signed { background: #dcfce7; color: #166534; }
</style>
