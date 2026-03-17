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

    <!-- Date Range Filter -->
    <div class="filter-bar">
      <div class="filter-item">
        <label class="form-label">{{ t('report.from') }}</label>
        <input v-model="dateFrom" type="date" class="form-input" @change="fetchReport" />
      </div>
      <div class="filter-item">
        <label class="form-label">{{ t('report.to') }}</label>
        <input v-model="dateTo" type="date" class="form-input" @change="fetchReport" />
      </div>
      <div class="filter-item export-group">
        <label class="form-label">{{ t('report.granularity') }}</label>
        <select v-model="granularity" class="form-select">
          <option value="weekly">{{ t('report.weekly') }}</option>
          <option value="monthly">{{ t('report.monthly') }}</option>
        </select>
      </div>
      <div class="filter-item filter-actions">
        <button class="btn btn-primary" @click="handleExport">{{ t('report.exportCsv') }}</button>
      </div>
    </div>

    <!-- Report Table -->
    <div class="card">
      <ReportTable
        :columns="currentColumns"
        :data="reportData"
        :loading="loading"
        :summary="summaryRow"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';
import ReportTable from '../components/report/ReportTable.vue';

const { t } = useI18n();
const toast = useToast();

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
  gap: 0.25rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #374151;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

.filter-item {
  min-width: 140px;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.export-group {
  min-width: 120px;
}
</style>
