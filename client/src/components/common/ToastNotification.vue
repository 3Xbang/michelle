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
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="remove(toast.id)" aria-label="Close">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  color: #fff;
}

.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
.toast-info { background: #2563eb; }

.toast-message {
  flex: 1;
  margin-right: 0.5rem;
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

/* Transitions */
.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
