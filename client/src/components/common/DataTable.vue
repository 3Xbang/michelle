<template>
  <div>
    <!-- Card Mode -->
    <template v-if="cardMode">
      <div v-if="loading" class="card-list-empty">
        {{ t('common.loading') }}
      </div>
      <div v-else-if="!data || data.length === 0" class="card-list-empty">
        <SvgIcon name="search" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('common.noData') }}</p>
      </div>
      <div v-else class="card-list">
        <div
          v-for="(row, idx) in data"
          :key="idx"
          class="card-item"
          role="link"
          tabindex="0"
          @click="navigateToDetail(row)"
          @keydown.enter="navigateToDetail(row)"
        >
          <div class="card-item-header">
            <span class="card-item-title">{{ row[cardTitleKey] }}</span>
            <span
              v-if="cardStatusKey && row[cardStatusKey]"
              class="status-badge"
              :class="'status-' + row[cardStatusKey]"
            >
              <SvgIcon :name="statusIconName(row[cardStatusKey])" :size="14" />
              {{ row[cardStatusKey] }}
            </span>
          </div>
          <div v-if="cardSubtitleKey && row[cardSubtitleKey]" class="card-item-subtitle">
            {{ row[cardSubtitleKey] }}
          </div>
        </div>
      </div>
    </template>

    <!-- Table Mode -->
    <template v-else>
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
                <div class="table-empty-content">
                  <SvgIcon name="search" :size="48" class="empty-icon" />
                  <p class="empty-text">{{ t('common.noData') }}</p>
                </div>
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
    </template>

    <div v-if="!cardMode && total > 0" class="pagination">
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
import { useRouter } from 'vue-router';
import SvgIcon from '../icons/SvgIcon.vue';

const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  sortKey: { type: String, default: '' },
  sortOrder: { type: String, default: 'asc' },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
  cardMode: { type: Boolean, default: false },
  cardTitleKey: { type: String, default: '' },
  cardSubtitleKey: { type: String, default: '' },
  cardStatusKey: { type: String, default: '' },
  cardLinkFn: { type: Function, default: null }
});

defineEmits(['sort', 'page-change']);

const STATUS_ICON_MAP = {
  pending: 'clock',
  checked_in: 'check',
  completed: 'check',
  checked_out: 'close',
  urgent: 'warning',
  active: 'check',
  maintenance: 'warning',
};

function statusIconName(status) {
  return STATUS_ICON_MAP[status] || 'clock';
}

const totalPages = computed(() =>
  props.pageSize > 0 ? Math.ceil(props.total / props.pageSize) : 0
);

function navigateToDetail(row) {
  if (props.cardLinkFn) {
    const route = props.cardLinkFn(row);
    if (route) {
      router.push(route);
    }
  }
}
</script>

<style scoped>
/* Card Mode */
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card-item {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}

.card-item:hover,
.card-item:focus-visible {
  box-shadow: var(--shadow-md);
  outline: none;
}

.card-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.card-item-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-item-subtitle {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-muted);
}

/* Empty state (shared between card and table modes) */
.empty-icon {
  opacity: 0.4;
  margin-bottom: var(--spacing-sm);
}

.empty-text {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin: 0;
}

.table-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) 0;
}

/* Table Mode */
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
