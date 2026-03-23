<template>
  <div>
    <h1 class="page-title">{{ route.params.id && route.params.id !== 'new' ? t('room.editTitle') : t('room.createTitle') }}</h1>

    <div class="card">
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-grid">
          <FormField :label="t('room.nameCn')" :error="errors.room_name_cn" required>
            <input v-model="form.room_name_cn" class="form-input" @blur="validate('room_name_cn')" />
          </FormField>

          <FormField :label="t('room.nameEn')" :error="errors.room_name_en" required>
            <input v-model="form.room_name_en" class="form-input" @blur="validate('room_name_en')" />
          </FormField>

          <FormField :label="t('room.roomType')" :error="errors.room_type" required>
            <select v-model="form.room_type" class="form-select" @blur="validate('room_type')">
              <option value="">--</option>
              <option v-for="rt in roomTypes" :key="rt" :value="rt">
                {{ t('enum.roomType.' + rt) }}
              </option>
            </select>
          </FormField>

          <FormField :label="t('owner.owner')">
            <select v-model="form.owner_id" class="form-select">
              <option value="">-- {{ t('common.none') }} --</option>
              <option v-for="o in owners" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </FormField>

          <FormField :label="t('owner.template')">
            <select v-model="form.template_id" class="form-select" :disabled="!form.owner_id || !templates.length">
              <option value="">-- {{ t('common.none') }} --</option>
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">
                {{ tpl.project_name || tpl.template_name }}
                <template v-if="tpl.project_type"> ({{ tpl.project_type }})</template>
              </option>
            </select>
          </FormField>

          <FormField :label="t('room.baseDailyRate')" :error="errors.base_daily_rate" required>
            <input v-model.number="form.base_daily_rate" type="number" step="0.01" min="0" class="form-input" @blur="validate('base_daily_rate')" />
          </FormField>

          <FormField :label="t('room.roomStatus')">
            <div class="status-toggle">
              <label class="toggle-label">
                <input type="checkbox" v-model="isActive" class="toggle-input" />
                <span class="toggle-text">{{ isActive ? t('enum.roomStatus.active') : t('enum.roomStatus.maintenance') }}</span>
              </label>
            </div>
          </FormField>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-icon" :disabled="submitting">
            <SvgIcon name="save" :size="18" />
            {{ submitting ? t('common.loading') : t('common.save') }}
          </button>
          <router-link to="/rooms" class="btn btn-outline">{{ t('common.cancel') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '../stores/room.js';
import { useToast } from '../composables/useToast.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();
const toast = useToast();

const roomTypes = ['villa', 'homestay', 'apartment'];
const submitting = ref(false);
const isActive = ref(true);
const owners = ref([]);
const templates = ref([]);

const form = reactive({
  room_name_cn: '',
  room_name_en: '',
  room_type: '',
  base_daily_rate: '',
  owner_id: '',
  template_id: '',
});

function positiveNumber(message) {
  return (v) => {
    if (v === '' || v === null || v === undefined) return '';
    if (Number(v) <= 0) return message;
    return '';
  };
}

const { errors, validateField, validateAll } = useValidation({
  room_name_cn: [requiredRule(t('validation.required'))],
  room_name_en: [requiredRule(t('validation.required'))],
  room_type: [requiredRule(t('validation.required'))],
  base_daily_rate: [
    requiredRule(t('validation.required')),
    positiveNumber(t('validation.positiveNumber')),
  ],
});

function validate(field) {
  validateField(field, form[field]);
}

async function handleSubmit() {
  if (!validateAll(form)) return;

  submitting.value = true;
  try {
    const payload = {
      room_name_cn: form.room_name_cn.trim(),
      room_name_en: form.room_name_en.trim(),
      room_type: form.room_type,
      base_daily_rate: Number(form.base_daily_rate),
      status: isActive.value ? 'active' : 'maintenance',
      owner_id: form.owner_id || null,
      template_id: form.template_id || null,
    };

    if (route.params.id && route.params.id !== 'new') {
      await roomStore.updateRoom(route.params.id, payload);
    } else {
      await roomStore.createRoom(payload);
    }
    toast.success(t('common.save'));
    router.push('/rooms');
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function loadRoom() {
  const id = route.params.id;
  if (!id || id === 'new') return;
  try {
    const data = await roomStore.getRoom(id);
    form.room_name_cn = data.room_name_cn;
    form.room_name_en = data.room_name_en;
    form.room_type = data.room_type;
    form.base_daily_rate = data.base_daily_rate;
    form.owner_id = data.owner_id || '';
    form.template_id = data.template_id || '';
    isActive.value = data.status === 'active';
    // Load templates for the owner if set
    if (data.owner_id) {
      await loadTemplates(data.owner_id);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.notFound'));
    router.push('/rooms');
  }
}

async function loadOwners() {
  try {
    const res = await apiClient.get('/owners');
    owners.value = res.data;
  } catch {
    owners.value = [];
  }
}

async function loadTemplates(ownerId) {
  if (!ownerId) { templates.value = []; return; }
  try {
    const res = await apiClient.get(`/owners/${ownerId}/templates`);
    templates.value = res.data;
  } catch {
    templates.value = [];
  }
}

// When owner changes, reload templates and clear template selection
watch(() => form.owner_id, (newOwnerId) => {
  form.template_id = '';
  loadTemplates(newOwnerId);
});

// When template changes, auto-fill room_type and base_daily_rate
watch(() => form.template_id, (newTplId) => {
  if (!newTplId) return;
  const tpl = templates.value.find(t => t.id === newTplId || t.id === Number(newTplId));
  if (tpl) {
    if (tpl.daily_rate) form.base_daily_rate = tpl.daily_rate;
  }
});

onMounted(() => {
  loadOwners();
  loadRoom();
});
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--spacing-lg);
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.form-actions .btn {
  width: 100%;
}

@media (min-width: 640px) {
  .form-actions {
    flex-direction: row;
  }

  .form-actions .btn {
    width: auto;
  }
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-toggle {
  padding-top: 0.25rem;
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
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}
</style>
