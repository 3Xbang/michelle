<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('sales.reports.title') }}</h1>
    </div>

    <div class="filter-bar">
      <div class="date-range">
        <input v-model="startDate" type="date" class="form-input" />
        <span class="date-sep">~</span>
        <input v-model="endDate" type="date" class="form-input" />
      </div>
      <button class="btn btn-primary btn-sm" @click="load" :disabled="store.loading">
        {{ store.loading ? t('common.loading') : t('common.search', '查询') }}
      </button>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="store.reportData.length === 0" class="empty-text">{{ t('sales.reports.noData') }}</div>

    <div v-else class="table-wrapper">
      <table class="report-table">
        <thead>
          <tr>
            <th @click="sortBy('salesperson_name')" class="sortable">{{ t('sales.reports.salesperson') }} <span class="sort-icon">{{ sortIcon('salesperson_name') }}</span></th>
            <th @click="sortBy('viewing_count')" class="sortable">{{ t('sales.reports.viewingCount') }} <span class="sort-icon">{{ sortIcon('viewing_count') }}</span></th>
            <th @click="sortBy('intent_count')" class="sortable">{{ t('sales.reports.intentCount') }} <span class="sort-icon">{{ sortIcon('intent_count') }}</span></th>
            <th @click="sortBy('signed_count')" class="sortable">{{ t('sales.reports.signedCount') }} <span class="sort-icon">{{ sortIcon('signed_count') }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sortedData" :key="row.salesperson_id">
            <td class="td-name">{{ row.salesperson_name }}</td>
            <td class="td-num">{{ row.viewing_count || 0 }}</td>
            <td class="td-num">{{ row.intent_count || 0 }}</td>
            <td class="td-num"><span class="signed-num">{{ row.signed_count || 0 }}</span></td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>{{ t('sales.reports.total') }}</td>
            <td class="td-num">{{ totals.viewing_count }}</td>
            <td class="td-num">{{ totals.intent_count }}</td>
            <td class="td-num">{{ totals.signed_count }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSalesReportStore } from '../../stores/salesReport.js';

const { t } = useI18n();
const store = useSalesReportStore();

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const startDate = ref(firstDay.toISOString().slice(0, 10));
const endDate = ref(today.toISOString().slice(0, 10));

const sortKey = ref('signed_count');
const sortDir = ref('desc');

function sortBy(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'desc';
  }
}

function sortIcon(key) {
  if (sortKey.value !== key) return '↕';
  return sortDir.value === 'asc' ? '↑' : '↓';
}

const sortedData = computed(() => {
  const data = [...store.reportData];
  return data.sort((a, b) => {
    const av = a[sortKey.value] ?? 0;
    const bv = b[sortKey.value] ?? 0;
    if (typeof av === 'string') return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir.value === 'asc' ? av - bv : bv - av;
  });
});

const totals = computed(() => ({
  viewing_count: store.reportData.reduce((s, r) => s + (r.viewing_count || 0), 0),
  intent_count: store.reportData.reduce((s, r) => s + (r.intent_count || 0), 0),
  signed_count: store.reportData.reduce((s, r) => s + (r.signed_count || 0), 0),
}));

function load() { store.fetchReport(startDate.value, endDate.value); }
onMounted(load);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.filter-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; align-items: center; flex-wrap: wrap; }
.date-range { display: flex; align-items: center; gap: 0.5rem; }
.date-sep { color: var(--color-text-secondary, #6b7280); font-weight: 600; }
.form-input {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; font-size: 0.875rem; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
}

.table-wrapper { overflow-x: auto; }
.report-table {
  width: 100%; border-collapse: collapse;
  background: var(--color-surface, #fff);
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.report-table th {
  background: #f9fafb; padding: 0.875rem 1rem;
  text-align: left; font-size: 0.875rem; font-weight: 700;
  color: var(--color-text-secondary, #6b7280);
  border-bottom: 1.5px solid var(--color-border, #e5e7eb);
}
.report-table td {
  padding: 0.875rem 1rem; font-size: 0.9375rem;
  border-bottom: 1px solid var(--color-border, #f3f4f6);
  color: var(--color-text-primary, #111827);
}
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { background: #f3f4f6; }
.sort-icon { font-size: 0.75rem; color: #9ca3af; }
.td-name { font-weight: 600; }
.td-num { text-align: center; }
.signed-num { font-weight: 800; color: #166534; }
.total-row td { font-weight: 700; background: #f9fafb; border-top: 2px solid var(--color-border, #e5e7eb); }
</style>
