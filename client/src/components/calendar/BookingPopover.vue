<template>
  <Teleport to="body">
    <div v-if="visible" class="popover-overlay" @click.self="$emit('close')">
      <div class="popover-card" :style="popoverStyle" ref="popoverRef">
        <div class="popover-header">
          <span class="status-badge" :class="'status-' + booking.booking_status">
            {{ t('enum.bookingStatus.' + booking.booking_status) }}
          </span>
          <button class="popover-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="popover-body">
          <div class="popover-row">
            <span class="popover-label">{{ t('calendar.guest') }}</span>
            <span class="popover-value">{{ booking.guest_name }}</span>
          </div>
          <div class="popover-row">
            <span class="popover-label">{{ t('booking.checkIn') }}</span>
            <span class="popover-value">{{ booking.check_in }}</span>
          </div>
          <div class="popover-row">
            <span class="popover-label">{{ t('booking.checkOut') }}</span>
            <span class="popover-value">{{ booking.check_out }}</span>
          </div>
          <div class="popover-row">
            <span class="popover-label">{{ t('calendar.platform') }}</span>
            <span class="popover-value">{{ booking.platform_source }}</span>
          </div>
        </div>
        <div class="popover-footer">
          <router-link :to="'/bookings/' + booking.id" class="btn btn-primary btn-sm">
            {{ t('calendar.viewDetail') }}
          </router-link>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  booking: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
});

defineEmits(['close']);

const popoverStyle = computed(() => ({
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
}));
</script>

<style scoped>
.popover-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.popover-card {
  position: absolute;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  width: 260px;
  z-index: 1001;
  overflow: hidden;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.popover-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.popover-close:hover {
  color: #111827;
}

.popover-body {
  padding: 0.75rem 1rem;
}

.popover-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8125rem;
}

.popover-row:last-child {
  margin-bottom: 0;
}

.popover-label {
  color: #6b7280;
}

.popover-value {
  color: #111827;
  font-weight: 500;
}

.popover-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
}
</style>
