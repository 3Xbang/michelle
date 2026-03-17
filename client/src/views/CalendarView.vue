<template>
  <div>
    <h1 class="page-title">{{ t('calendar.title') }}</h1>

    <!-- Month navigation -->
    <div class="calendar-nav">
      <button class="btn btn-outline" @click="prevMonth">
        &laquo; {{ t('calendar.prevMonth') }}
      </button>
      <span class="calendar-month-label">{{ monthLabel }}</span>
      <button class="btn btn-outline" @click="nextMonth">
        {{ t('calendar.nextMonth') }} &raquo;
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="calendar-loading">{{ t('common.loading') }}</div>

    <!-- Calendar grid -->
    <div v-else class="card calendar-card">
      <CalendarGrid
        :rooms="rooms"
        :bookings="bookings"
        :year="year"
        :month="month"
        @booking-click="onBookingClick"
      />
    </div>

    <!-- Booking popover -->
    <BookingPopover
      v-if="selectedBooking"
      :booking="selectedBooking"
      :visible="!!selectedBooking"
      :position="popoverPosition"
      @close="selectedBooking = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '../api/client.js';
import { useToast } from '../composables/useToast.js';
import CalendarGrid from '../components/calendar/CalendarGrid.vue';
import BookingPopover from '../components/calendar/BookingPopover.vue';

const { t } = useI18n();
const toast = useToast();

const now = new Date();
const year = ref(now.getFullYear());
const month = ref(now.getMonth() + 1);

const rooms = ref([]);
const bookings = ref([]);
const loading = ref(false);

const selectedBooking = ref(null);
const popoverPosition = ref({ x: 0, y: 0 });

const monthLabel = computed(() => {
  const date = new Date(year.value, month.value - 1);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
});

function prevMonth() {
  if (month.value === 1) {
    month.value = 12;
    year.value--;
  } else {
    month.value--;
  }
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1;
    year.value++;
  } else {
    month.value++;
  }
}

async function fetchCalendarData() {
  loading.value = true;
  try {
    const { data } = await apiClient.get('/bookings/calendar', {
      params: { year: year.value, month: month.value },
    });
    rooms.value = data.rooms || [];
    bookings.value = data.bookings || [];
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}

function onBookingClick({ booking, event }) {
  const rect = event.target.getBoundingClientRect();
  popoverPosition.value = {
    x: Math.min(rect.left, window.innerWidth - 280),
    y: rect.bottom + 4,
  };
  selectedBooking.value = booking;
}

watch([year, month], () => {
  selectedBooking.value = null;
  fetchCalendarData();
});

onMounted(fetchCalendarData);
</script>

<style scoped>
.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.calendar-month-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  min-width: 160px;
  text-align: center;
}

.calendar-card {
  padding: 0.75rem;
}

.calendar-loading {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}
</style>
