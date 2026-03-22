<template>
  <Teleport to="body">
    <div v-if="visible" class="popover-overlay" :class="{ 'popover-overlay--mobile': !isDesktop }" @click.self="$emit('close')">
      <Transition :name="!isDesktop ? 'drawer-slide' : ''">
        <div
          v-if="visible"
          class="popover-card"
          :class="{ 'popover-card--drawer': !isDesktop }"
          :style="isDesktop ? popoverStyle : undefined"
          ref="popoverRef"
        >
          <div class="popover-header">
            <span class="status-badge" :class="'status-' + booking.booking_status">
              <SvgIcon :name="statusIconName(booking.booking_status)" :size="14" />
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
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '../../composables/useMediaQuery';
import SvgIcon from '../icons/SvgIcon.vue';

const STATUS_ICON_MAP = {
  pending: 'clock',
  checked_in: 'check',
  completed: 'check',
  checked_out: 'close',
  urgent: 'warning',
  active: 'check',
  maintenance: 'warning',
};

function statusIconName(status) {
  return STATUS_ICON_MAP[status] || 'clock';
}

const { t } = useI18n();

const isDesktop = useMediaQuery('(min-width: 768px)');

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

.popover-overlay--mobile {
  background: rgba(0, 0, 0, 0.4);
}

.popover-card {
  position: absolute;
  background: var(--color-surface, #fff);
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  width: 260px;
  z-index: 1001;
  overflow: hidden;
}

.popover-card--drawer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
  box-shadow: var(--shadow-lg, 0 4px 24px rgba(0, 0, 0, 0.15));
}

/* Drawer slide transition */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform var(--transition-slow, 300ms ease);
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateY(100%);
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.popover-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
  line-height: 1;
  min-width: var(--touch-target-min, 44px);
  min-height: var(--touch-target-min, 44px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popover-close:hover {
  color: var(--color-text-primary, #111827);
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
  color: var(--color-text-muted, #6b7280);
}

.popover-value {
  color: var(--color-text-primary, #111827);
  font-weight: 500;
}

.popover-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  text-align: right;
}

.popover-card--drawer .popover-footer {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
}
</style>
