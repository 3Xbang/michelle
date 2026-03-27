<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.reminders.title') }}</h1>
    </div>

    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="reminders.length === 0" class="empty-text">{{ t('sales.reminders.noData') }}</div>

    <div v-else class="reminder-list">
      <div v-for="r in reminders" :key="r.intent_id" class="reminder-item card" @click="router.push(`/sales/intents/${r.intent_id}`)">
        <div class="reminder-main">
          <div class="reminder-info">
            <span class="reminder-customer">{{ r.customer_name }}</span>
            <span class="reminder-property">{{ r.property_name }}</span>
          </div>
          <span class="level-badge" :class="'level-' + r.intent_level">{{ t('sales.intents.level.' + r.intent_level) }}</span>
        </div>
        <div class="reminder-meta">
          <span class="days-badge" :class="daysClass(r.days_since_followup)">{{ r.days_since_followup }} {{ t('sales.reminders.daysAgo') }}</span>
          <span class="last-follow">{{ t('sales.reminders.lastFollowUp') }}：{{ formatDate(r.last_followed_at) }}</span>
          <span v-if="authStore.isAdmin && r.salesperson_name" class="reminder-sales">{{ t('sales.customers.salesperson') }}：{{ r.salesperson_name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth.js';
import { remindersApi } from '../../api/sales.js';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const reminders = ref([]);

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
function daysClass(days) {
  if (days >= 14) return 'days-danger';
  if (days >= 7) return 'days-warning';
  return 'days-normal';
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await remindersApi.list();
    reminders.value = data.sort((a, b) => (b.days_since_followup || 0) - (a.days_since_followup || 0));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }

.reminder-list { display: flex; flex-direction: column; gap: 0.75rem; }
.reminder-item {
  padding: 1rem 1.25rem; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.reminder-item:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.reminder-main { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
.reminder-info { display: flex; flex-direction: column; gap: 0.2rem; }
.reminder-customer { font-weight: 700; font-size: 1rem; color: var(--color-text-primary, #111827); }
.reminder-property { font-size: 0.875rem; color: #2563eb; }

.reminder-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-size: 0.8125rem; }
.last-follow { color: var(--color-text-secondary, #6b7280); }
.reminder-sales { color: var(--color-text-secondary, #6b7280); }

.days-badge {
  font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.625rem; border-radius: 999px;
}
.days-normal { background: #f3f4f6; color: #374151; }
.days-warning { background: #fef9c3; color: #854d0e; }
.days-danger { background: #fee2e2; color: #991b1b; }

.level-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; }
.level-cold { background: #dbeafe; color: #1d4ed8; }
.level-warm { background: #fef9c3; color: #854d0e; }
.level-hot { background: #fee2e2; color: #991b1b; }
.level-signed { background: #dcfce7; color: #166534; }
</style>
