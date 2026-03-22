<template>
  <!-- Desktop: horizontal filter bar -->
  <div v-if="isDesktop" class="filter-bar">
    <div v-for="field in filterFields" :key="field.key" class="filter-item">
      <label class="form-label">{{ field.label }}</label>
      <select
        v-if="field.type === 'select'"
        :value="localFilters[field.key]"
        class="form-select"
        @change="onDesktopFieldChange(field.key, $event.target.value)"
      >
        <option value="">{{ t('common.all') }}</option>
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <input
        v-else
        :type="field.type || 'text'"
        :value="localFilters[field.key]"
        class="form-input"
        @change="onDesktopFieldChange(field.key, $event.target.value)"
      />
    </div>
    <div class="filter-item filter-actions">
      <button class="btn btn-outline" @click="handleReset">{{ t('common.reset') }}</button>
    </div>
  </div>

  <!-- Mobile: filter button + drawer -->
  <div v-else class="mobile-filter">
    <button class="mobile-filter__btn" @click="toggleDrawer">
      <SvgIcon name="filter" :size="18" />
      <span>{{ t('common.filter') }}</span>
      <span v-if="activeCount > 0" class="mobile-filter__badge">{{ activeCount }}</span>
      <SvgIcon :name="drawerOpen ? 'chevron-up' : 'chevron-down'" :size="16" />
    </button>

    <Teleport to="body">
      <transition name="mobile-filter-drawer">
        <div v-if="drawerOpen" class="mobile-filter__overlay" @click.self="closeDrawer">
          <div class="mobile-filter__drawer">
            <div class="mobile-filter__drawer-header">
              <span class="mobile-filter__drawer-title">{{ t('common.filter') }}</span>
              <button class="mobile-filter__close-btn" @click="closeDrawer">
                <SvgIcon name="close" :size="20" />
              </button>
            </div>

            <div class="mobile-filter__drawer-body">
              <div v-for="field in filterFields" :key="field.key" class="mobile-filter__field">
                <label class="form-label">{{ field.label }}</label>
                <select
                  v-if="field.type === 'select'"
                  v-model="localFilters[field.key]"
                  class="form-select"
                >
                  <option value="">{{ t('common.all') }}</option>
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <input
                  v-else
                  :type="field.type || 'text'"
                  v-model="localFilters[field.key]"
                  class="form-input"
                />
              </div>
            </div>

            <div class="mobile-filter__drawer-footer">
              <button class="btn btn-outline mobile-filter__action-btn" @click="handleReset">
                {{ t('common.reset') }}
              </button>
              <button class="btn btn-primary mobile-filter__action-btn" @click="handleApply">
                {{ t('common.apply') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '../../composables/useMediaQuery'
import SvgIcon from '../icons/SvgIcon.vue'

const props = defineProps({
  filters: { type: Object, default: () => ({}) },
  filterFields: { type: Array, required: true },
  activeCount: { type: Number, default: 0 }
})

const emit = defineEmits(['apply', 'reset'])
const { t } = useI18n()
const isDesktop = useMediaQuery('(min-width: 768px)')
const drawerOpen = ref(false)

// Local copy of filters for the drawer form
const localFilters = reactive({})

// Sync local filters from props
watch(
  () => props.filters,
  (val) => {
    for (const field of props.filterFields) {
      localFilters[field.key] = val[field.key] ?? ''
    }
  },
  { immediate: true, deep: true }
)

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function closeDrawer() {
  drawerOpen.value = false
}

function handleApply() {
  emit('apply', { ...localFilters })
  closeDrawer()
}

function handleReset() {
  for (const field of props.filterFields) {
    localFilters[field.key] = ''
  }
  emit('reset')
  closeDrawer()
}

// Desktop mode: emit apply immediately on field change
function onDesktopFieldChange(key, value) {
  localFilters[key] = value
  emit('apply', { ...localFilters })
}
</script>

<style scoped>
/* Mobile filter button */
.mobile-filter {
  margin-bottom: var(--spacing-md);
}

.mobile-filter__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.25rem;
  min-height: var(--touch-target-min);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.mobile-filter__btn:hover {
  border-color: var(--color-primary);
}

.mobile-filter__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-primary);
  color: #ffffff;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  line-height: 1;
}

/* Overlay */
.mobile-filter__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

/* Drawer panel */
.mobile-filter__drawer {
  width: 100%;
  max-height: 80vh;
  background: var(--color-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-filter__drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.mobile-filter__drawer-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.mobile-filter__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min);
  height: var(--touch-target-min);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.mobile-filter__close-btn:hover {
  background: var(--color-bg);
}

.mobile-filter__drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.mobile-filter__field {
  margin-bottom: var(--spacing-md);
}

.mobile-filter__field:last-child {
  margin-bottom: 0;
}

.mobile-filter__drawer-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.mobile-filter__action-btn {
  flex: 1;
  min-height: var(--touch-target-nav);
}

/* Drawer transition */
.mobile-filter-drawer-enter-active,
.mobile-filter-drawer-leave-active {
  transition: opacity var(--transition-slow);
}

.mobile-filter-drawer-enter-active .mobile-filter__drawer,
.mobile-filter-drawer-leave-active .mobile-filter__drawer {
  transition: transform var(--transition-slow);
}

.mobile-filter-drawer-enter-from,
.mobile-filter-drawer-leave-to {
  opacity: 0;
}

.mobile-filter-drawer-enter-from .mobile-filter__drawer,
.mobile-filter-drawer-leave-to .mobile-filter__drawer {
  transform: translateY(100%);
}
</style>
