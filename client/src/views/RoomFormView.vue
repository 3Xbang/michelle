<template>
  <div>
    <h1 class="page-title">{{ t('room.editTitle') }}</h1>

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
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? t('common.loading') : t('common.save') }}
          </button>
          <router-link to="/rooms" class="btn btn-outline">{{ t('common.cancel') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '../stores/room.js';
import { useToast } from '../composables/useToast.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import FormField from '../components/common/FormField.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();
const toast = useToast();

const roomTypes = ['villa', 'homestay', 'apartment'];
const submitting = ref(false);
const isActive = ref(true);

const form = reactive({
  room_name_cn: '',
  room_name_en: '',
  room_type: '',
  base_daily_rate: '',
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
    isActive.value = data.status === 'active';
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.notFound'));
    router.push('/rooms');
  }
}

onMounted(() => {
  loadRoom();
});
</script>

<style scoped>
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
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
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
  font-size: 0.875rem;
  color: #374151;
}
</style>
