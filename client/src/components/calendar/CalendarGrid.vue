<template>
  <div class="calendar-grid-wrapper">
    <div class="calendar-grid">
      <!-- Header row: room label column + day columns -->
      <div class="grid-header">
        <div class="room-label-cell header-cell">{{ t('booking.room') }}</div>
        <div v-for="info in dayInfos" :key="info.day" class="day-cell header-cell">
          <span class="day-number">{{ info.day }}</span>
          <span class="day-weekday">{{ info.weekday }}</span>
        </div>
      </div>

      <!-- Room rows -->
      <div
        v-for="room in rooms"
        :key="room.id"
        class="grid-row"
        :class="{ 'maintenance-row': room.status === 'maintenance' }"
      >
        <div class="room-label-cell">
          <span class="room-name">{{ roomDisplayName(room) }}</span>
          <span v-if="room.status === 'maintenance'" class="maintenance-tag">
            {{ t('calendar.maintenance') }}
          </span>
        </div>

        <!-- Day cells container (relative for booking bars) -->
        <div class="day-cells">
          <div v-for="day in daysInMonth" :key="day" class="day-cell body-cell"></div>

          <!-- Booking bars overlaid on day cells -->
          <div
            v-for="bar in getBookingBars(room.id)"
            :key="bar.booking.id"
            class="booking-bar"
            :class="'bar-' + bar.booking.booking_status"
            :style="barStyle(bar)"
            :title="bar.booking.guest_name"
            @click.stop="handleBookingClick($event, bar.booking)"
          >
            <span class="bar-text">{{ bar.booking.guest_name }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="rooms.length === 0" class="empty-state">
        {{ t('common.noData') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps({
  rooms: { type: Array, default: () => [] },
  bookings: { type: Array, default: () => [] },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
});

const emit = defineEmits(['booking-click']);

const daysInMonth = computed(() => {
  const count = new Date(props.year, props.month, 0).getDate();
  return Array.from({ length: count }, (_, i) => i + 1);
});

const weekdayAbbrs = {
  'zh-CN': ['日', '一', '二', '三', '四', '五', '六'],
  'en-US': ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};

const dayInfos = computed(() => {
  return daysInMonth.value.map((day) => {
    const date = new Date(props.year, props.month - 1, day);
    const dow = date.getDay();
    const abbrs = weekdayAbbrs[locale.value] || weekdayAbbrs['en-US'];
    return { day, weekday: abbrs[dow] };
  });
});

function roomDisplayName(room) {
  if (locale.value === 'zh-CN') {
    return room.room_name_cn || room.room_name_en;
  }
  return room.room_name_en || room.room_name_cn;
}

function getBookingBars(roomId) {
  const totalDays = daysInMonth.value.length;
  const monthStart = new Date(props.year, props.month - 1, 1);
  const monthEnd = new Date(props.year, props.month - 1, totalDays);

  return props.bookings
    .filter((b) => b.room_id === roomId)
    .map((booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);

      // Clamp to month boundaries
      const startDate = checkIn < monthStart ? monthStart : checkIn;
      const endDate = checkOut > monthEnd ? new Date(monthEnd.getTime() + 86400000) : checkOut;

      const startDay = startDate.getDate();
      // endDate is exclusive (check_out day), so the last occupied day is endDate - 1
      const endDay = endDate > monthEnd ? totalDays : endDate.getDate() - 1;

      // If endDay < startDay, booking doesn't actually occupy days in this month visually
      if (endDay < startDay) return null;

      return { booking, startDay, endDay };
    })
    .filter(Boolean);
}

function barStyle(bar) {
  const totalDays = daysInMonth.value.length;
  const left = ((bar.startDay - 1) / totalDays) * 100;
  const width = ((bar.endDay - bar.startDay + 1) / totalDays) * 100;
  return {
    left: `${left}%`,
    width: `${width}%`,
  };
}

function handleBookingClick(event, booking) {
  emit('booking-click', { booking, event });
}
</script>

<style scoped>
.calendar-grid-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.calendar-grid {
  min-width: 800px;
}

.grid-header {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  top: 0;
  z-index: 2;
}

.grid-header .header-cell {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
  padding: 0.5rem 0;
}

.room-label-cell {
  min-width: 120px;
  width: 120px;
  flex-shrink: 0;
  padding: 0.5rem 0.5rem;
  font-size: var(--font-size-sm, 0.8125rem);
  font-weight: 500;
  color: var(--color-text-secondary, #374151);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--color-surface, #ffffff);
}

.grid-header .room-label-cell {
  background: #f9fafb;
  z-index: 3;
}

.room-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.maintenance-tag {
  font-size: 0.625rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0 0.25rem;
  border-radius: 3px;
  margin-top: 0.125rem;
  display: inline-block;
}

.grid-header .day-cell {
  flex: 1;
  min-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1.2;
}

.day-number {
  font-size: 0.75rem;
  font-weight: 600;
}

.day-weekday {
  font-size: 0.625rem;
  font-weight: 400;
  color: var(--color-text-muted, #6b7280);
}

.grid-row {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
  min-height: 48px;
}

.grid-row:hover {
  background: #fafbfc;
}

.maintenance-row {
  background: #f9fafb;
}

.maintenance-row > .room-label-cell {
  background: #f9fafb;
}

.day-cells {
  display: flex;
  flex: 1;
  position: relative;
}

.day-cells .body-cell {
  flex: 1;
  min-width: 28px;
  border-right: 1px solid #f3f4f6;
}

.booking-bar {
  position: absolute;
  top: 6px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 6px;
  overflow: hidden;
  z-index: 1;
  transition: opacity 0.15s;
}

.booking-bar:hover {
  opacity: 0.85;
}

.bar-pending {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.bar-checked_in {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
}

.bar-checked_out {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.bar-text {
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
  font-size: 0.875rem;
}
</style>
