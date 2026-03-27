<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('sales.customers.edit') : t('sales.customers.create') }}</h1>
    </div>

    <div class="card form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label required">{{ t('sales.customers.fields.name') }}</label>
            <input v-model="form.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label required">{{ t('sales.customers.fields.phone') }}</label>
            <input v-model="form.phone" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.customers.fields.wechat') }}</label>
            <input v-model="form.wechat" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.customers.fields.budgetMin') }}</label>
            <input v-model.number="form.budget_min" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.customers.fields.budgetMax') }}</label>
            <input v-model.number="form.budget_max" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.customers.fields.leadSource') }}</label>
            <select v-model="form.lead_source" class="form-select">
              <option value="">{{ t('common.none') }}</option>
              <option value="walk_in">{{ t('sales.customers.source.walk_in') }}</option>
              <option value="referral">{{ t('sales.customers.source.referral') }}</option>
              <option value="online_ad">{{ t('sales.customers.source.online_ad') }}</option>
              <option value="agent">{{ t('sales.customers.source.agent') }}</option>
              <option value="other">{{ t('sales.customers.source.other') }}</option>
            </select>
          </div>
          <div v-if="authStore.isAdmin" class="form-group">
            <label class="form-label">{{ t('sales.customers.fields.salesperson') }}</label>
            <select v-model="form.salesperson_id" class="form-select">
              <option value="">{{ t('common.none') }}</option>
              <option v-for="u in salespersons" :key="u.id" :value="u.id">{{ u.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('sales.customers.fields.preferences') }}</label>
          <textarea v-model="form.preferences" class="form-input form-textarea" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.customers.fields.notes') }}</label>
          <textarea v-model="form.notes" class="form-input form-textarea" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
          <button type="button" class="btn btn-outline" @click="router.back()">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesCustomerStore } from '../../stores/salesCustomer.js';
import { useAuthStore } from '../../stores/auth.js';
import { useToast } from '../../composables/useToast.js';
import apiClient from '../../api/client.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useSalesCustomerStore();
const authStore = useAuthStore();
const toast = useToast();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const salespersons = ref([]);

const form = reactive({
  name: '', phone: '', wechat: '',
  budget_min: '', budget_max: '',
  preferences: '', lead_source: '',
  salesperson_id: '', notes: '',
});

async function handleSubmit() {
  saving.value = true;
  try {
    const payload = { ...form };
    if (!payload.budget_min) delete payload.budget_min;
    if (!payload.budget_max) delete payload.budget_max;
    if (!payload.salesperson_id) delete payload.salesperson_id;
    if (isEdit.value) {
      await store.updateCustomer(route.params.id, payload);
      toast.success(t('common.save'));
      router.back();
    } else {
      const created = await store.createCustomer(payload);
      toast.success(t('common.save'));
      router.replace(`/sales/customers/${created.id}`);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (authStore.isAdmin) {
    try {
      const { data } = await apiClient.get('/users');
      salespersons.value = data.filter(u => u.role !== 'Admin');
    } catch { /* ignore */ }
  }
  if (isEdit.value) {
    const c = await store.fetchCustomer(route.params.id);
    Object.assign(form, {
      name: c.name || '', phone: c.phone || '', wechat: c.wechat || '',
      budget_min: c.budget_min || '', budget_max: c.budget_max || '',
      preferences: c.preferences || '', lead_source: c.lead_source || '',
      salesperson_id: c.salesperson_id || '', notes: c.notes || '',
    });
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.form-card { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
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
.form-select {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827); font-size: 0.9375rem; cursor: pointer;
}
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
</style>
