<template>
  <div class="inquiry-page">
    <div class="inquiry-card card">
      <div class="inquiry-logo">{{ t('sales.inquiry.title') }}</div>
      <h1 class="inquiry-title">{{ t('sales.inquiry.subtitle') }}</h1>

      <div v-if="submitted" class="success-msg">
        <div class="success-icon">✓</div>
        <div class="success-text">{{ t('sales.inquiry.success') }}</div>
      </div>

      <form v-else @submit.prevent="handleSubmit" novalidate>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.inquiry.fields.name') }}</label>
          <input v-model="form.name" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.inquiry.fields.phone') }}</label>
          <input v-model="form.phone" class="form-input" type="tel" required />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.inquiry.fields.wechat') }}</label>
          <input v-model="form.wechat" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.inquiry.fields.budgetRange') }}</label>
          <div class="budget-row">
            <input v-model.number="form.budget_min" class="form-input" type="number" :placeholder="t('sales.inquiry.fields.budgetMin')" />
            <span class="budget-sep">~</span>
            <input v-model.number="form.budget_max" class="form-input" type="number" :placeholder="t('sales.inquiry.fields.budgetMax')" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.inquiry.fields.interestedProperties') }}</label>
          <div v-if="propertiesLoading" class="loading-hint">{{ t('common.loading') }}</div>
          <div v-else class="property-checkboxes">
            <label v-for="p in properties" :key="p.id" class="checkbox-item">
              <input type="checkbox" :value="p.id" v-model="form.property_ids" />
              <span>{{ p.name }}</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.inquiry.fields.notes') }}</label>
          <textarea v-model="form.notes" class="form-input form-textarea" rows="3"></textarea>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting">
          {{ submitting ? t('sales.inquiry.submitting') : t('sales.inquiry.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { submitInquiry } from '../../api/publicInquiry.js';
import { salesPropertiesApi } from '../../api/sales.js';

const { t } = useI18n();

const form = reactive({
  name: '', phone: '', wechat: '',
  budget_min: '', budget_max: '',
  property_ids: [], notes: '',
});

const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref('');
const properties = ref([]);
const propertiesLoading = ref(false);

async function handleSubmit() {
  errorMsg.value = '';
  submitting.value = true;
  try {
    const payload = { ...form };
    if (!payload.budget_min) delete payload.budget_min;
    if (!payload.budget_max) delete payload.budget_max;
    if (!payload.wechat) delete payload.wechat;
    if (!payload.notes) delete payload.notes;
    await submitInquiry(payload);
    submitted.value = true;
  } catch (err) {
    if (err.response?.status === 429) {
      errorMsg.value = t('sales.inquiry.rateLimited');
    } else {
      errorMsg.value = err.response?.data?.message || t('sales.inquiry.failed');
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  propertiesLoading.value = true;
  try {
    const { data } = await salesPropertiesApi.list({ status: 'available' });
    properties.value = data;
  } catch { /* ignore */ }
  finally { propertiesLoading.value = false; }
});
</script>

<style scoped>
.inquiry-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 1.5rem;
}

.inquiry-card {
  width: 100%; max-width: 480px;
  padding: 2rem;
}

.inquiry-logo {
  text-align: center; font-size: 1.5rem; font-weight: 800;
  color: var(--color-primary, #2563eb); letter-spacing: 0.05em; margin-bottom: 0.5rem;
}
.inquiry-title {
  font-size: 1.125rem; font-weight: 700; text-align: center;
  margin-bottom: 1.5rem; color: var(--color-text-primary, #111827);
}

.form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
.form-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary, #111827); }
.form-label.required::after { content: ' *'; color: #ef4444; }
.form-input {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; font-size: 0.9375rem; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
}
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.form-textarea { resize: vertical; min-height: 80px; }

.budget-row { display: flex; align-items: center; gap: 0.5rem; }
.budget-sep { color: var(--color-text-secondary, #6b7280); font-weight: 600; }

.loading-hint { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }
.property-checkboxes { display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto; }
.checkbox-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
.checkbox-item input { width: 16px; height: 16px; cursor: pointer; }

.error-msg {
  background: #fee2e2; color: #991b1b; border-radius: 8px;
  padding: 0.625rem 0.875rem; font-size: 0.875rem; margin-bottom: 1rem;
}

.submit-btn { width: 100%; min-height: 48px; font-size: 1rem; margin-top: 0.5rem; }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.success-msg {
  text-align: center; padding: 2rem 1rem;
}
.success-icon {
  width: 4rem; height: 4rem; border-radius: 50%;
  background: #dcfce7; color: #166534; font-size: 2rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1rem;
}
.success-text { font-size: 1rem; color: var(--color-text-primary, #111827); font-weight: 600; }
</style>
