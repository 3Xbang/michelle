<template>
  <div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="{ sortable: col.sortable, active: sortKey === col.key }"
              @click="col.sortable && $emit('sort', col.key)"
            >
              {{ col.label }}
              <span v-if="col.sortable" class="sort-indicator">
                <span v-if="sortKey === col.key">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                <span v-else class="sort-inactive">⇅</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="table-loading">
              {{ t('common.loading') }}
            </td>
          </tr>
          <tr v-else-if="!data || data.length === 0">
            <td :colspan="columns.length" class="table-empty">
              {{ t('common.noData') }}
            </td>
          </tr>
          <template v-else>
            <tr v-for="(row, idx) in data" :key="idx">
              <td v-for="col in columns" :key="col.key">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="total > 0" class="pagination">
      <span class="pagination-info">{{ t('pagination.total', { total }) }}</span>
      <div class="pagination-controls">
        <button
          class="btn btn-outline btn-sm"
          :disabled="page <= 1"
          @click="$emit('page-change', page - 1)"
        >
          ‹
        </button>
        <span class="pagination-page">{{ t('pagination.page', { page }) }}</span>
        <button
          class="btn btn-outline btn-sm"
          :disabled="page >= totalPages"
          @click="$emit('page-change', page + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: 'asc' },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 }
});

defineEmits(['sort', 'page-change']);

const totalPages = computed(() =>
  props.pageSize > 0 ? Math.ceil(props.total / props.pageSize) : 0
);
</script>

<style scoped>
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
  user-select: none;
}

.data-table th.sortable {
  cursor: pointer;
}
.data-table th.sortable:hover {
  background: #f3f4f6;
}
.data-table th.active {
  color: #2563eb;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 0.7rem;
}
.sort-inactive {
  opacity: 0.3;
}

.table-loading,
.table-empty {
  text-align: center;
  padding: 2rem 0.75rem;
  color: #6b7280;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-page {
  min-width: 5rem;
  text-align: center;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style>
