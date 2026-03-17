<template>
  <div>
    <div v-if="loading" class="table-loading">{{ t('common.loading') }}</div>
    <div v-else-if="!data || data.length === 0" class="table-empty">{{ t('common.noData') }}</div>
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in data" :key="idx">
            <td v-for="col in columns" :key="col.key">
              {{ col.format ? col.format(row[col.key]) : row[col.key] }}
            </td>
          </tr>
        </tbody>
        <tfoot v-if="summary">
          <tr class="summary-row">
            <td v-for="(col, idx) in columns" :key="col.key">
              <template v-if="idx === 0">{{ t('report.summary') }}</template>
              <template v-else>{{ col.format ? col.format(summary[col.key]) : (summary[col.key] ?? '') }}</template>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  summary: { type: Object, default: null },
});
</script>

<style scoped>
.table-loading,
.table-empty {
  text-align: center;
  padding: 2rem 0.75rem;
  color: #6b7280;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.625rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.summary-row {
  background: #f0f9ff;
  font-weight: 600;
}

.summary-row td {
  border-top: 2px solid #2563eb;
  color: #1e40af;
}
</style>
