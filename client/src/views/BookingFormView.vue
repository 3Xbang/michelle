<template>
  <div>
    <h1 class="page-title">{{ isEdit ? t('booking.editTitle') : t('booking.createTitle') }}</h1>

    <div class="card">
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-grid">
          <!-- Room -->
          <FormField :label="t('booking.room')" :error="errors.room_id" required>
            <select v-model="form.room_id" class="form-select" @blur="validate('room_id')">
              <option value="">--</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.room_name_cn }} / {{ room.room_name_en }}
              </option>
            </select>
          </FormField>

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

          <!-- Platform Source -->
          <FormField :label="t('booking.platformSource')" :error="errors.platform_source" required>
            <select v-model="form.platform_source" class="form-select" @blur="validate('platform_source')">
              <option value="">--</option>
              <option v-for="p in platforms" :key="p" :value="p">{{ t('enum.platform.' + p) }}</option>
            </select>
          </FormField>

          <!-- Total Revenue -->
          <FormField :label="t('booking.totalRevenue')" :error="errors.total_revenue" required>
            <input v-model.number="form.total_revenue" type="number" step="0.01" min="0" class="form-input" @blur="validate('total_revenue')" />
          </FormField>

          <!-- Commission -->
          <FormField :label="t('booking.commission')" :error="errors.commission" required>
            <input v-model.number="form.commission" type="number" step="0.01" min="0" class="form-input" @blur="validate('commission')" />
          </FormField>

          <!-- Net Income (read-only, edit mode) -->
          <FormField v-if="isEdit" :label="t('booking.netIncome')">
            <input :value="formatNumber(booking?.net_income)" class="form-input" disabled />
          </FormField>

          <!-- Created By (read-only, edit mode) -->
          <FormField v-if="isEdit" :label="t('booking.createdBy')">
            <input :value="booking?.created_by_name || booking?.created_by || '-'" class="form-input" disabled />
          </FormField>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? t('common.loading') : t('common.save') }}
          </button>
          <router-link to="/bookings" class="btn btn-outline">{{ t('common.cancel') }}</router-link>
        </div>
      </form>
    </div>
  </div>
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

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const bookingStore = useBookingStore();
const toast = useToast();

const platforms = [
  'Airbnb', 'Agoda', 'Booking.com', 'Trip.com',
  '途家', '小猪', '美团民宿', '飞猪',
  'Expedia', 'VRBO', '直客', '其他',
];

const isEdit = computed(() => route.name === 'BookingDetail');
const rooms = ref([]);
const booking = ref(null);
const submitting = ref(false);

const form = reactive({
  room_id: '',
  guest_name: '',
  check_in: '',
  check_out: '',
  rental_type: '',
  platform_source: '',
  total_revenue: '',
  commission: '',
});

const { errors, validateField, validateAll, clearErrors } = useValidation({
  room_id: [requiredRule(t('validation.required'))],
  guest_name: [requiredRule(t('validation.required'))],
  check_in: [requiredRule(t('validation.required'))],
  check_out: [
    requiredRule(t('validation.required')),
    dateAfter(() => form.check_in, t('validation.checkOutAfterCheckIn')),
  ],
  rental_type: [requiredRule(t('validation.required'))],
  platform_source: [requiredRule(t('validation.required'))],
  total_revenue: [
    requiredRule(t('validation.required')),
    nonNegative(t('validation.nonNegative')),
  ],
  commission: [
    requiredRule(t('validation.required')),
    nonNegative(t('validation.nonNegative')),
  ],
});

function validate(field) {
  validateField(field, form[field]);
}

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
      platform_source: form.platform_source,
      total_revenue: Number(form.total_revenue),
      commission: Number(form.commission),
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
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function loadRooms() {
  try {
    const { data } = await apiClient.get('/rooms');
    rooms.value = Array.isArray(data) ? data : (data.data || []);
  } catch {
    rooms.value = [];
  }
}

async function loadBooking() {
  if (!isEdit.value) return;
  try {
    const data = await bookingStore.getBooking(route.params.id);
    booking.value = data;
    form.room_id = data.room_id;
    form.guest_name = data.guest_name;
    form.check_in = data.check_in;
    form.check_out = data.check_out;
    form.rental_type = data.rental_type;
    form.platform_source = data.platform_source;
    form.total_revenue = data.total_revenue;
    form.commission = data.commission;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.notFound'));
    router.push('/bookings');
  }
}

onMounted(() => {
  loadRooms();
  loadBooking();
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
</style>
