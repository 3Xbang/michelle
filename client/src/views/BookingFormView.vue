<template>
  <div>
    <h1 class="page-title">{{ isEdit ? t('booking.editTitle') : t('booking.createTitle') }}</h1>

    <div class="card">
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-grid">
          <!-- Room -->
          <FormField :label="t('booking.room')" :error="errors.room_id" required>
            <select v-model="form.room_id" class="form-select" @blur="validate('room_id')" @change="onRoomChange">
              <option value="">--</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.room_name_cn }} / {{ room.room_name_en }}
              </option>
            </select>
          </FormField>

          <!-- Room photo preview -->
          <div v-if="selectedRoomPhotos.length" class="room-photo-preview">
            <div class="room-photo-scroll">
              <img v-for="url in selectedRoomPhotos" :key="url" :src="url" class="room-photo-thumb" @click="previewPhoto(url)" />
            </div>
            <div class="room-photo-count">{{ selectedRoomPhotos.length }} 张照片</div>
          </div>

          <!-- Guest Name -->
          <FormField :label="t('booking.guestName')" :error="errors.guest_name" required>
            <input v-model="form.guest_name" class="form-input" @blur="validate('guest_name')" />
          </FormField>

          <!-- Check In -->
          <FormField :label="t('booking.checkIn')" :error="errors.check_in" required>
            <input v-model="form.check_in" type="date" class="form-input" @blur="validate('check_in')" />
          </FormField>

          <!-- Check Out -->
          <FormField :label="t('booking.checkOut')" :error="errors.check_out" required>
            <input v-model="form.check_out" type="date" class="form-input" @blur="validate('check_out')" />
          </FormField>

          <!-- Rental Type -->
          <FormField :label="t('booking.rentalType')" :error="errors.rental_type" required>
            <select v-model="form.rental_type" class="form-select" @blur="validate('rental_type')">
              <option value="">--</option>
              <option value="daily">{{ t('enum.rentalType.daily') }}</option>
              <option value="monthly">{{ t('enum.rentalType.monthly') }}</option>
              <option value="yearly">{{ t('enum.rentalType.yearly') }}</option>
            </select>
          </FormField>

          <!-- Total Revenue -->
          <FormField :label="t('booking.totalRevenue')" :error="errors.total_revenue" required>
            <input v-model.number="form.total_revenue" type="number" step="0.01" min="0" class="form-input"
              @blur="validate('total_revenue')" @input="recalc" />
          </FormField>
        </div>

        <!-- Source Type Toggle -->
        <div class="source-type-section">
          <div class="source-type-label">{{ t('booking.sourceType') }}</div>
          <div class="source-toggle">
            <button type="button" class="toggle-btn" :class="{ active: form.source_type === 'platform' }"
              @click="setSourceType('platform')">
              {{ t('booking.sourcePlatform') }}
            </button>
            <button type="button" class="toggle-btn" :class="{ active: form.source_type === 'agent' }"
              @click="setSourceType('agent')">
              {{ t('booking.sourceAgent') }}
            </button>
          </div>
        </div>

        <!-- Platform fields -->
        <div v-if="form.source_type === 'platform'" class="form-grid">
          <FormField :label="t('booking.sourcePlatform')" :error="errors.platform_id">
            <select v-model="form.platform_id" class="form-select" @change="recalc">
              <option value="">--</option>
              <option v-for="p in platforms" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </FormField>
          <FormField :label="t('booking.commission')">
            <input :value="formatNumber(calcCommission)" class="form-input" disabled />
          </FormField>
          <FormField :label="t('booking.tax')">
            <input :value="formatNumber(calcTax)" class="form-input" disabled />
          </FormField>
          <FormField :label="t('booking.netIncome')">
            <input :value="formatNumber(calcNetIncome)" class="form-input net-income" disabled />
          </FormField>
          <div class="calc-hint">{{ t('booking.netIncomeCalc') }}</div>
        </div>

        <!-- Agent fields -->
        <div v-if="form.source_type === 'agent'" class="form-grid">
          <FormField :label="t('booking.sourceAgent')" :error="errors.agent_id">
            <select v-model="form.agent_id" class="form-select">
              <option value="">--</option>
              <option v-for="a in agents" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </FormField>
          <FormField :label="t('booking.agentFee')" :error="errors.agent_fee">
            <input v-model.number="form.agent_fee" type="number" step="0.01" min="0" class="form-input"
              @input="recalc" />
          </FormField>
          <FormField :label="t('booking.netIncome')">
            <input :value="formatNumber(calcNetIncome)" class="form-input net-income" disabled />
          </FormField>
          <div class="calc-hint">{{ t('booking.netIncomeCalcAgent') }}</div>
        </div>

        <!-- Created By (edit mode) -->
        <div class="form-grid" v-if="isEdit">
          <FormField :label="t('booking.createdBy')">
            <input :value="booking?.created_by_name || booking?.created_by || '-'" class="form-input" disabled />
          </FormField>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-icon" :disabled="submitting">
            <SvgIcon name="save" :size="18" />
            {{ submitting ? t('common.loading') : t('common.save') }}
          </button>
          <router-link to="/bookings" class="btn btn-outline">{{ t('common.cancel') }}</router-link>
        </div>
      </form>
    </div>
  </div>

  <!-- Photo preview overlay -->
  <Teleport to="body">
    <div v-if="previewUrl" class="photo-preview-overlay" @click="previewUrl = null">
      <img :src="previewUrl" class="photo-preview-img" />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useBookingStore } from '../stores/booking.js';
import { useToast } from '../composables/useToast.js';
import { useValidation, required as requiredRule, nonNegative, dateAfter } from '../composables/useValidation.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();
const toast = useToast();

const isEdit = computed(() => route.name === 'BookingDetail');
const rooms = ref([]);
const platforms = ref([]);
const agents = ref([]);
const booking = ref(null);
const submitting = ref(false);

// Room photos
const roomTemplatePhotos = ref({});  // templateId -> photos[]
const previewUrl = ref(null);
const selectedRoomPhotos = computed(() => {
  if (!form.room_id) return [];
  const room = rooms.value.find(r => r.id === Number(form.room_id) || r.id === form.room_id);
  if (!room || !room.template_id) return [];
  return roomTemplatePhotos.value[room.template_id] || [];
});

function previewPhoto(url) { previewUrl.value = url; }
function onRoomChange() { /* photos auto-computed */ }

const form = reactive({
  room_id: '',
  guest_name: '',
  check_in: '',
  check_out: '',
  rental_type: '',
  source_type: 'platform',
  platform_id: '',
  agent_id: '',
  agent_fee: 0,
  total_revenue: '',
});

// Auto-calc
const selectedPlatform = computed(() => platforms.value.find(p => p.id === form.platform_id));
const calcCommission = computed(() => {
  if (!selectedPlatform.value || !form.total_revenue) return 0;
  return Number(form.total_revenue) * (Number(selectedPlatform.value.commission_rate) / 100);
});
const calcTax = computed(() => {
  if (!selectedPlatform.value || !form.total_revenue) return 0;
  return Number(form.total_revenue) * (Number(selectedPlatform.value.tax_rate) / 100);
});
const calcNetIncome = computed(() => {
  const rev = Number(form.total_revenue) || 0;
  if (form.source_type === 'platform') return rev - calcCommission.value - calcTax.value;
  return rev - (Number(form.agent_fee) || 0);
});

function recalc() { /* reactivity handles it */ }

function setSourceType(type) {
  form.source_type = type;
  form.platform_id = '';
  form.agent_id = '';
  form.agent_fee = 0;
}

const { errors, validateField, validateAll } = useValidation({
  room_id: [requiredRule(t('validation.required'))],
  guest_name: [requiredRule(t('validation.required'))],
  check_in: [requiredRule(t('validation.required'))],
  check_out: [
    requiredRule(t('validation.required')),
    dateAfter(() => form.check_in, t('validation.checkOutAfterCheckIn')),
  ],
  rental_type: [requiredRule(t('validation.required'))],
  total_revenue: [requiredRule(t('validation.required')), nonNegative(t('validation.nonNegative'))],
});

function validate(field) { validateField(field, form[field]); }

function formatNumber(val) {
  if (val == null) return '-';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function handleSubmit() {
  if (!validateAll(form)) return;
  submitting.value = true;
  try {
    const payload = {
      room_id: Number(form.room_id),
      guest_name: form.guest_name.trim(),
      check_in: form.check_in,
      check_out: form.check_out,
      rental_type: form.rental_type,
      source_type: form.source_type,
      platform_id: form.source_type === 'platform' && form.platform_id ? Number(form.platform_id) : null,
      agent_id: form.source_type === 'agent' && form.agent_id ? Number(form.agent_id) : null,
      agent_fee: form.source_type === 'agent' ? Number(form.agent_fee) || 0 : 0,
      total_revenue: Number(form.total_revenue),
      commission: form.source_type === 'platform' ? calcCommission.value : 0,
      tax: form.source_type === 'platform' ? calcTax.value : 0,
    };
    if (isEdit.value) {
      await bookingStore.updateBooking(route.params.id, payload);
      toast.success(t('common.save'));
    } else {
      await bookingStore.createBooking(payload);
      toast.success(t('booking.createTitle'));
    }
    router.push('/bookings');
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    submitting.value = false;
  }
}

async function loadRooms() {
  try {
    const { data } = await apiClient.get('/rooms');
    rooms.value = Array.isArray(data) ? data : (data.data || []);
    // Load template photos for rooms that have template_id
    const templateIds = [...new Set(rooms.value.filter(r => r.template_id).map(r => r.template_id))];
    for (const tid of templateIds) {
      try {
        const tpl = (await apiClient.get('/owners/templates/' + tid + '/photos')).data;
        roomTemplatePhotos.value[tid] = tpl.photos || [];
      } catch { roomTemplatePhotos.value[tid] = []; }
    }
  } catch { rooms.value = []; }
}

async function loadPlatforms() {
  try { platforms.value = (await apiClient.get('/platforms')).data; }
  catch { platforms.value = []; }
}

async function loadAgents() {
  try { agents.value = (await apiClient.get('/agents')).data; }
  catch { agents.value = []; }
}

async function loadBooking() {
  if (!isEdit.value) return;
  try {
    const data = await bookingStore.getBooking(route.params.id);
    booking.value = data;
    form.room_id = data.room_id;
    form.guest_name = data.guest_name;
    form.check_in = data.check_in?.slice(0, 10) || data.check_in;
    form.check_out = data.check_out?.slice(0, 10) || data.check_out;
    form.rental_type = data.rental_type;
    form.source_type = data.source_type || 'platform';
    form.platform_id = data.platform_id || '';
    form.agent_id = data.agent_id || '';
    form.agent_fee = data.agent_fee || 0;
    form.total_revenue = data.total_revenue;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.notFound'));
    router.push('/bookings');
  }
}

onMounted(() => { loadRooms(); loadPlatforms(); loadAgents(); loadBooking(); });
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@media (min-width: 640px) {
  .form-grid { grid-template-columns: 1fr 1fr; gap: 0 var(--spacing-lg); }
}

.source-type-section {
  margin: 1rem 0 0.5rem;
}
.source-type-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 0.5rem;
}
.source-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.toggle-btn {
  flex: 1;
  padding: 0.625rem 1rem;
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface, #fff);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-secondary, #6b7280);
}
.toggle-btn.active {
  border-color: var(--color-primary, #2563eb);
  background: var(--color-primary, #2563eb);
  color: #fff;
}

.net-income { font-weight: 700; color: var(--color-primary, #2563eb); }

.calc-hint {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 0.5rem;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}
.form-actions .btn { width: 100%; }
@media (min-width: 640px) {
  .form-actions { flex-direction: row; }
  .form-actions .btn { width: auto; }
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Room photo preview */
.room-photo-preview {
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
}
.room-photo-scroll {
  display: flex; gap: 0.5rem; overflow-x: auto;
  padding-bottom: 0.25rem;
}
.room-photo-thumb {
  width: 80px; height: 60px; object-fit: cover;
  border-radius: 6px; flex-shrink: 0; cursor: zoom-in;
  border: 1.5px solid #e5e7eb;
}
.room-photo-count { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; }

.photo-preview-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; cursor: zoom-out;
}
.photo-preview-img { max-width: 90vw; max-height: 90vh; border-radius: 8px; object-fit: contain; }
</style>
