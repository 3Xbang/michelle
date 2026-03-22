<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast-${toast.type}`]"
          role="alert"
        >
          <SvgIcon :name="iconMap[toast.type] || 'warning'" :size="18" class="toast-icon" />
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="remove(toast.id)" aria-label="Close">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast.js';
import SvgIcon from '../icons/SvgIcon.vue';

const { toasts, remove } = useToast();

const iconMap = {
  success: 'check',
  error: 'close',
  info: 'warning'
};
</script>

<style scoped>
/* Mobile-first: top center, full width */
.toast-container {
  position: fixed;
  top: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: calc(100% - 32px);
}

.toast {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  font-size: 0.875rem;
  color: #fff;
}

.toast-success { background: var(--color-success); }
.toast-error { background: var(--color-danger-hover); }
.toast-info { background: var(--color-primary); }

.toast-icon {
  flex-shrink: 0;
  margin-right: var(--spacing-sm);
}

.toast-message {
  flex: 1;
  margin-right: var(--spacing-sm);
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.125rem;
  cursor: pointer;
  opacity: 0.8;
  padding: 0;
  line-height: 1;
}
.toast-close:hover {
  opacity: 1;
}

/* Desktop: right-top positioning, constrained width */
@media (min-width: 768px) {
  .toast-container {
    left: auto;
    right: var(--spacing-md);
    transform: none;
    width: auto;
    max-width: 360px;
  }
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-slow);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

@media (min-width: 768px) {
  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
