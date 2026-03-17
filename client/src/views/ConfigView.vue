<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('config.title') }}</h1>
      <button class="btn btn-primary" @click="openForm(null)">{{ t('config.addConfig') }}</button>
    </div>

    <!-- Config List -->
    <div class="card">
      <div v-if="appStore.configLoading" class="table-loading">{{ t('common.loading') }}</div>
      <div v-else-if="appStore.configs.length === 0" class="table-empty">{{ t('common.noData') }}</div>
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
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import FormField from '../components/common/FormField.vue';

const { t } = useI18n();
const appStore = useAppStore();
const toast = useToast();

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
  margin-bottom: 1.5rem;
}

.page-header .page-title {
  margin-bottom: 0;
}

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

.switch-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
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
  font-size: 0.8rem;
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

.modal-content {
  width: 100%;
  max-width: 480px;
  margin: 1rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-input {
  width: 1rem;
  height: 1rem;
}

.toggle-text {
  font-size: 0.875rem;
  color: #374151;
}
</style>
