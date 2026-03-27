<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('sales.viewingRecords.title') : t('sales.viewingRecords.create') }}</h1>
    </div>

    <div class="card form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label required">{{ t('sales.viewingRecords.fields.customer') }}</label>
          <select v-model="form.customer_id" class="form-select" required>
            <option value="">{{ t('common.none') }}</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.phone }})</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.viewingRecords.fields.property') }}</label>
          <select v-model="form.property_id" class="form-select" required>
            <option value="">{{ t('common.none') }}</option>
            <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.viewingRecords.fields.viewedAt') }}</label>
          <input v-model="form.viewed_at" type="datetime-local" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.viewingRecords.fields.salesperson') }}</label>
          <select v-model="form.salesperson_id" class="form-select" required>
            <option value="">{{ t('common.none') }}</option>
            <option v-for="u in salespersons" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('sales.viewingRecords.fields.notes') }}</label>
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
import { useToast } from '../../composables/useToast.js';
import { viewingRecordsApi } from '../../api/sales.js';
import { useSalesPropertyStore } from '../../stores/salesProperty.js';
import { useSalesCustomerStore } from '../../stores/salesCustomer.js';
import apiClient from '../../api/client.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const propStore = useSalesPropertyStore();
const custStore = useSalesCustomerStore();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const salespersons = ref([]);
const customers = ref([]);
const properties = ref([]);

const form = reactive({
  customer_id: route.query.customer_id || '',
  property_id: route.query.property_id || '',
  viewed_at: '', salesperson_id: '', notes: '',
});

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await viewingRecordsApi.update(route.params.id, form);
    } else {
      await viewingRecordsApi.create(form);
    }
    toast.success(t('common.save'));
    router.back();
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const [usersRes] = await Promise.all([apiClient.get('/users'), propStore.fetchProperties(), custStore.fetchCustomers()]);
  salespersons.value = usersRes.data;
  properties.value = propStore.properties;
  customers.value = custStore.customers;
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.form-card { padding: 1.5rem; }
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
