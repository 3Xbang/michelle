<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('user.title') }}</h1>
      <button v-if="isDesktop" class="btn btn-primary btn-icon" @click="openForm(null)">
        <SvgIcon name="plus" :size="18" />
        {{ t('user.createTitle') }}
      </button>
    </div>

    <!-- User List -->
    <div class="card">
      <PullToRefresh :loading="loading" @refresh="handlePullRefresh">
        <DataTable
          :columns="columns"
          :data="users"
          :loading="loading"
          :card-mode="!isDesktop"
          card-title-key="name"
          card-subtitle-key="email"
          card-status-key="role"
        >
          <template #cell-name="{ row }">
            {{ row.name }}
          </template>
          <template #cell-role="{ row }">
            <span class="status-badge" :class="'status-' + row.role">
              {{ t('enum.userRole.' + row.role) }}
            </span>
          </template>
          <template #cell-actions="{ row }">
            <div class="action-btns">
              <button class="btn btn-sm btn-outline" @click="openForm(row)">{{ t('common.edit') }}</button>
              <button class="btn btn-sm btn-danger" @click="confirmDelete(row)">{{ t('common.delete') }}</button>
            </div>
          </template>
        </DataTable>
      </PullToRefresh>
    </div>

    <!-- Mobile: create user button at bottom of list -->
    <div v-if="!isDesktop" class="mobile-create-bar">
      <button class="btn btn-primary mobile-create-btn btn-icon" @click="openForm(null)">
        <SvgIcon name="plus" :size="18" />
        {{ t('user.createTitle') }}
      </button>
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
            <button type="submit" class="btn btn-primary btn-icon" :disabled="submitting">
              <SvgIcon name="save" :size="18" />
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="closeForm">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      :visible="!!deletingUser"
      :title="t('common.confirmDelete')"
      :message="deletingUser?.name"
      @confirm="handleDelete"
      @cancel="deletingUser = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';
import DataTable from '../components/common/DataTable.vue';
import PullToRefresh from '../components/common/PullToRefresh.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const toast = useToast();
const isDesktop = useMediaQuery('(min-width: 768px)');

const users = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingUser = ref(null);
const submitting = ref(false);
const deletingUser = ref(null);
const deleting = ref(false);

const form = reactive({
  name: '',
  email: '',
  role: '',
  preferred_lang: 'CN',
  phone: '',
  password: '',
});

const columns = computed(() => [
  { key: 'name', label: t('user.userName') },
  { key: 'email', label: t('user.email') },
  { key: 'role', label: t('user.role') },
  { key: 'phone', label: t('user.phone') },
  { key: 'preferred_lang', label: t('user.preferredLang') },
  { key: 'actions', label: '' },
]);

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

function handlePullRefresh() {
  fetchUsers();
}

function confirmDelete(user) {
  deletingUser.value = user;
}

async function handleDelete() {
  if (!deletingUser.value) return;
  deleting.value = true;
  try {
    await apiClient.delete(`/users/${deletingUser.value.id}`);
    toast.success(t('common.delete'));
    deletingUser.value = null;
    fetchUsers();
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    deleting.value = false;
  }
}

async function handleSubmit() {
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

.mobile-create-bar {
  margin-top: var(--spacing-md);
}

.mobile-create-btn {
  width: 100%;
}

.action-btns {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.625rem;
  font-size: 0.8125rem;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
}

.btn-danger:hover {
  background: #dc2626;
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
