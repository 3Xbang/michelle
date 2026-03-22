<template>
  <div>
    <h1 class="page-title">{{ t('report.title') }}</h1>

    <!-- Dimension Tabs -->
    <div class="tabs">
      <button
        v-for="dim in dimensions"
        :key="dim.key"
        class="tab-btn"
        :class="{ active: activeDimension === dim.key }"
        @click="switchDimension(dim.key)"
      >
        {{ dim.label }}
      </button>
    </div>

    <!-- Filters: MobileFilter for responsive behavior -->
    <MobileFilter
      :filters="currentFilters"
      :filter-fields="filterFields"
      :active-count="activeFilterCount"
      @apply="handleFilterApply"
      @reset="handleFilterReset"
    />

    <!-- Export button -->
    <div class="export-bar">
      <button class="btn btn-primary" @click="handleExport">{{ t('report.exportCsv') }}</button>
    </div>

    <!-- Report Table with horizontal scroll on mobile -->
    <div class="card">
      <div v-if="loading" class="table-loading">{{ t('common.loading') }}</div>
      <div v-else-if="!reportData || reportData.length === 0" class="table-empty">{{ t('common.noData') }}</div>
      <div v-else class="report-table-scroll">
        <ReportTable
          :columns="currentColumns"
          :data="reportData"
          :loading="false"
          :summary="summaryRow"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import apiClient from '../api/client.js';
import ReportTable from '../components/report/ReportTable.vue';
import MobileFilter from '../components/common/MobileFilter.vue';

const { t } = useI18n();
const toast = useToast();
const isDesktop = useMediaQuery('(min-width: 768px)');

const activeDimension = ref('room');
const dateFrom = ref('');
const dateTo = ref('');
const granularity = ref('monthly');
const reportData = ref([]);
const loading = ref(false);

const dimensions = computed(() => [
  { key: 'room', label: t('report.byRoom') },
  { key: 'rental_type', label: t('report.byRentalType') },
  { key: 'platform', label: t('report.byPlatform') },
  { key: 'month', label: t('report.byMonth') },
]);

const currentFilters = computed(() => ({
  from: dateFrom.value,
  to: dateTo.value,
  granularity: granularity.value,
}));

const filterFields = computed(() => [
  { key: 'from', label: t('report.from'), type: 'date' },
  { key: 'to', label: t('report.to'), type: 'date' },
  {
    key: 'granularity',
    label: t('report.granularity'),
    type: 'select',
    options: [
      { value: 'weekly', label: t('report.weekly') },
      { value: 'monthly', label: t('report.monthly') },
    ],
  },
]);

const activeFilterCount = computed(() => {
  let count = 0;
  if (dateFrom.value) count++;
  if (dateTo.value) count++;
  return count;
});

function handleFilterApply(newFilters) {
  dateFrom.value = newFilters.from || '';
  dateTo.value = newFilters.to || '';
  granularity.value = newFilters.granularity || 'monthly';
  fetchReport();
}

function handleFilterReset() {
  dateFrom.value = '';
  dateTo.value = '';
  granularity.value = 'monthly';
  fetchReport();
}

function formatNumber(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dimensionLabelKey = {
  room: 'booking.room',
  rental_type: 'booking.rentalType',
  platform: 'booking.platformSource',
  month: 'report.byMonth',
};

const dimensionFieldKey = {
  room: 'room_name',
  rental_type: 'rental_type',
  platform: 'platform_source',
  month: 'month',
};

const currentColumns = computed(() => {
  const dim = activeDimension.value;
  return [
    { key: dimensionFieldKey[dim], label: t(dimensionLabelKey[dim]) },
    { key: 'total_revenue', label: t('report.totalRevenue'), format: formatNumber },
    { key: 'total_commission', label: t('report.totalCommission'), format: formatNumber },
    { key: 'total_net_income', label: t('report.totalNetIncome'), format: formatNumber },
  ];
});

const summaryRow = computed(() => {
  if (!reportData.value.length) return null;
  const dim = activeDimension.value;
  const fieldKey = dimensionFieldKey[dim];
  return reportData.value.reduce(
    (acc, row) => {
      acc.total_revenue += Number(row.total_revenue || 0);
      acc.total_commission += Number(row.total_commission || 0);
      acc.total_net_income += Number(row.total_net_income || 0);
      return acc;
    },
    { [fieldKey]: t('report.summary'), total_revenue: 0, total_commission: 0, total_net_income: 0 }
  );
});

const apiPaths = {
  room: '/reports/by-room',
  rental_type: '/reports/by-rental-type',
  platform: '/reports/by-platform',
  month: '/reports/by-month',
};

async function fetchReport() {
  loading.value = true;
  try {
    const params = {};
    if (dateFrom.value) params.from = dateFrom.value;
    if (dateTo.value) params.to = dateTo.value;
    const { data } = await apiClient.get(apiPaths[activeDimension.value], { params });
    reportData.value = Array.isArray(data) ? data : (data.data || []);
  } catch {
    reportData.value = [];
  } finally {
    loading.value = false;
  }
}

function switchDimension(dim) {
  activeDimension.value = dim;
  fetchReport();
}

async function handleExport() {
  try {
    const params = {
      dimension: activeDimension.value,
      granularity: granularity.value,
    };
    if (dateFrom.value) params.from = dateFrom.value;
    if (dateTo.value) params.to = dateTo.value;

    const response = await apiClient.get('/reports/export', {
      params,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${activeDimension.value}-${granularity.value}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  }
}

onMounted(() => {
  fetchReport();
});
</script>

<style scoped>
.tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  white-space: nowrap;
  min-height: var(--touch-target-min);
}

.tab-btn:hover {
  color: var(--color-text-secondary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.export-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

/* Horizontally scrollable table wrapper for mobile */
.report-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-loading,
.table-empty {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}
</style>
