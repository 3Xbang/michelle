<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('config.title') }}</h1>
      <button v-if="isDesktop" class="btn btn-primary" @click="openForm(null)">{{ t('config.addConfig') }}</button>
    </div>

    <!-- Config List -->
    <div class="card">
      <PullToRefresh :loading="appStore.configLoading" @refresh="handlePullRefresh">
        <div v-if="appStore.configLoading" class="table-loading">{{ t('common.loading') }}</div>
        <div v-else-if="appStore.configs.length === 0" class="table-empty">{{ t('common.noData') }}</div>

        <!-- Mobile: Card Layout -->
        <div v-else-if="!isDesktop" class="config-card-list">
          <div
            v-for="cfg in appStore.configs"
            :key="cfg.id"
            class="config-card"
            @click="openForm(cfg)"
          >
            <div class="config-card-header">
              <span class="config-card-key">{{ cfg.config_key }}</span>
              <span class="switch-badge" :class="cfg.feature_switch ? 'switch-on' : 'switch-off'">
                {{ cfg.feature_switch ? t('common.yes') : t('common.no') }}
              </span>
            </div>
            <div class="config-card-value">{{ cfg.config_value || '—' }}</div>
            <div class="config-card-meta">{{ cfg.updated_at }}</div>
          </div>
        </div>

        <!-- Desktop: Table Layout -->
        <div v-else class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ t('config.configKey') }}</th>
                <th>{{ t('config.configValue') }}</th>
                <th>{{ t('config.featureSwitch') }}</th>
                <th>{{ t('common.updatedAt') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cfg in appStore.configs" :key="cfg.id">
                <td>{{ cfg.config_key }}</td>
                <td>{{ cfg.config_value }}</td>
                <td>
                  <span class="switch-badge" :class="cfg.feature_switch ? 'switch-on' : 'switch-off'">
                    {{ cfg.feature_switch ? t('common.yes') : t('common.no') }}
                  </span>
                </td>
                <td>{{ cfg.updated_at }}</td>
                <td>
                  <button class="btn btn-outline btn-sm" @click="openForm(cfg)">{{ t('common.edit') }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PullToRefresh>
    </div>

    <!-- Mobile: Add config button -->
    <div v-if="!isDesktop" class="mobile-create-bar">
      <button class="btn btn-primary mobile-create-btn" @click="openForm(null)">{{ t('config.addConfig') }}</button>
    </div>

    <!-- Add/Edit Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingConfig ? t('common.edit') : t('config.addConfig') }}</h2>
        <form @submit.prevent="handleSubmit" novalidate>
          <FormField :label="t('config.configKey')" :error="errors.config_key" required>
            <input v-model="form.config_key" class="form-input" :disabled="!!editingConfig" @blur="validate('config_key')" />
          </FormField>
          <FormField :label="t('config.configValue')" :error="errors.config_value">
            <input v-model="form.config_value" class="form-input" />
          </FormField>
          <FormField :label="t('config.featureSwitch')">
            <label class="toggle-label">
              <input type="checkbox" v-model="form.feature_switch" class="toggle-input" />
              <span class="toggle-text">{{ form.feature_switch ? t('common.yes') : t('common.no') }}</span>
            </label>
          </FormField>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="closeForm">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app.js';
import { useToast } from '../composables/useToast.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import FormField from '../components/common/FormField.vue';
import PullToRefresh from '../components/common/PullToRefresh.vue';

const { t } = useI18n();
const appStore = useAppStore();
const toast = useToast();
const isDesktop = useMediaQuery('(min-width: 768px)');

const showForm = ref(false);
const editingConfig = ref(null);
const submitting = ref(false);

const form = reactive({
  config_key: '',
  config_value: '',
  feature_switch: true,
});

const { errors, validateField, validateAll, clearErrors } = useValidation({
  config_key: [requiredRule(t('validation.required'))],
  config_value: [],
});

function validate(field) {
  validateField(field, form[field]);
}

function openForm(cfg) {
  clearErrors();
  if (cfg) {
    editingConfig.value = cfg;
    form.config_key = cfg.config_key;
    form.config_value = cfg.config_value || '';
    form.feature_switch = cfg.feature_switch;
  } else {
    editingConfig.value = null;
    form.config_key = '';
    form.config_value = '';
    form.feature_switch = true;
  }
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingConfig.value = null;
}

function handlePullRefresh() {
  appStore.fetchConfigs();
}

async function handleSubmit() {
  if (!validateAll(form)) return;

  submitting.value = true;
  try {
    const payload = {
      config_key: form.config_key.trim(),
      config_value: form.config_value,
      feature_switch: form.feature_switch,
    };

    if (editingConfig.value) {
      await appStore.updateConfig(editingConfig.value.id, payload);
    } else {
      await appStore.createConfig(payload);
    }
    toast.success(t('common.save'));
    closeForm();
    appStore.fetchConfigs();
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  appStore.fetchConfigs();
});
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.page-header .page-title {
  margin-bottom: 0;
}

.table-loading,
.table-empty {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--color-text-muted);
}

/* Mobile Card Layout */
.config-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.config-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
  border: 1px solid var(--color-border-light);
}

.config-card:active {
  box-shadow: var(--shadow-md);
}

.config-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.config-card-key {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: var(--spacing-sm);
}

.config-card-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  word-break: break-all;
}

.config-card-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Desktop Table Layout */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.data-table th,
.data-table td {
  padding: 0.625rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.data-table th {
  background: var(--color-bg);
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.data-table tbody tr:hover {
  background: var(--color-bg);
}

.switch-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.switch-on {
  background: #dcfce7;
  color: #15803d;
}

.switch-off {
  background: #fef2f2;
  color: #dc2626;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-sm);
}

.mobile-create-bar {
  margin-top: var(--spacing-md);
}

.mobile-create-btn {
  width: 100%;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

@media (max-width: 767px) {
  .modal-overlay {
    align-items: flex-end;
  }

  .modal-content {
    margin: 0;
    max-width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 85vh;
    overflow-y: auto;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
    min-height: var(--touch-target-nav);
  }
}

.modal-content {
  width: 100%;
  max-width: 480px;
  margin: var(--spacing-md);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  min-height: var(--touch-target-nav);
}

.toggle-input {
  width: 1.25rem;
  height: 1.25rem;
}

.toggle-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
