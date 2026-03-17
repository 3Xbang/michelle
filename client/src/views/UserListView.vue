<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('user.title') }}</h1>
      <button class="btn btn-primary" @click="openForm(null)">{{ t('user.createTitle') }}</button>
    </div>

    <!-- User List -->
    <div class="card">
      <div v-if="loading" class="table-loading">{{ t('common.loading') }}</div>
      <div v-else-if="users.length === 0" class="table-empty">{{ t('common.noData') }}</div>
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('user.userName') }}</th>
              <th>{{ t('user.email') }}</th>
              <th>{{ t('user.role') }}</th>
              <th>{{ t('user.phone') }}</th>
              <th>{{ t('user.preferredLang') }}</th>
              <th>{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ t('enum.userRole.' + u.role) }}</td>
              <td>{{ u.phone || '-' }}</td>
              <td>{{ t('enum.lang.' + u.preferred_lang) }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openForm(u)">{{ t('common.edit') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingUser ? t('user.editTitle') : t('user.createTitle') }}</h2>
        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-grid">
            <FormField :label="t('user.userName')" :error="errors.name" required>
              <input v-model="form.name" class="form-input" @blur="validate('name')" />
            </FormField>

            <FormField :label="t('user.email')" :error="errors.email" required>
              <input v-model="form.email" type="email" class="form-input" :disabled="!!editingUser" @blur="validate('email')" />
            </FormField>

            <FormField :label="t('user.role')" :error="errors.role" required>
              <select v-model="form.role" class="form-select" @blur="validate('role')">
                <option value="">--</option>
                <option value="Admin">{{ t('enum.userRole.Admin') }}</option>
                <option value="Staff">{{ t('enum.userRole.Staff') }}</option>
              </select>
            </FormField>

            <FormField :label="t('user.preferredLang')">
              <select v-model="form.preferred_lang" class="form-select">
                <option value="CN">{{ t('enum.lang.CN') }}</option>
                <option value="EN">{{ t('enum.lang.EN') }}</option>
              </select>
            </FormField>

            <FormField :label="t('user.phone')">
              <input v-model="form.phone" class="form-input" />
            </FormField>

            <FormField v-if="!editingUser" :label="t('user.password')" :error="errors.password" required>
              <input v-model="form.password" type="password" class="form-input" @blur="validate('password')" />
            </FormField>
          </div>

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
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';

const { t } = useI18n();
const toast = useToast();

const users = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingUser = ref(null);
const submitting = ref(false);

const form = reactive({
  name: '',
  email: '',
  role: '',
  preferred_lang: 'CN',
  phone: '',
  password: '',
});

const validationRules = computed(() => {
  const rules = {
    name: [requiredRule(t('validation.required'))],
    email: [requiredRule(t('validation.required'))],
    role: [requiredRule(t('validation.required'))],
  };
  if (!editingUser.value) {
    rules.password = [requiredRule(t('validation.required'))];
  }
  return rules;
});

const { errors, validateField, validateAll, clearErrors } = useValidation({
  name: [requiredRule(t('validation.required'))],
  email: [requiredRule(t('validation.required'))],
  role: [requiredRule(t('validation.required'))],
  password: [requiredRule(t('validation.required'))],
});

function validate(field) {
  // Skip password validation when editing
  if (field === 'password' && editingUser.value) return;
  validateField(field, form[field]);
}

function openForm(user) {
  clearErrors();
  if (user) {
    editingUser.value = user;
    form.name = user.name;
    form.email = user.email;
    form.role = user.role;
    form.preferred_lang = user.preferred_lang || 'CN';
    form.phone = user.phone || '';
    form.password = '';
  } else {
    editingUser.value = null;
    form.name = '';
    form.email = '';
    form.role = '';
    form.preferred_lang = 'CN';
    form.phone = '';
    form.password = '';
  }
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingUser.value = null;
}

async function fetchUsers() {
  loading.value = true;
  try {
    const { data } = await apiClient.get('/users');
    users.value = Array.isArray(data) ? data : (data.data || []);
  } catch {
    users.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  // Validate required fields
  let valid = true;
  for (const field of ['name', 'email', 'role']) {
    if (!validateField(field, form[field])) valid = false;
  }
  if (!editingUser.value) {
    if (!validateField('password', form.password)) valid = false;
  }
  if (!valid) return;

  submitting.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      preferred_lang: form.preferred_lang,
      phone: form.phone.trim(),
    };

    if (editingUser.value) {
      await apiClient.put(`/users/${editingUser.value.id}`, payload);
    } else {
      payload.password = form.password;
      await apiClient.post('/users', payload);
    }
    toast.success(t('common.save'));
    closeForm();
    fetchUsers();
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchUsers();
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
  max-width: 560px;
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 1.5rem;
}

@media (max-width: 639px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
