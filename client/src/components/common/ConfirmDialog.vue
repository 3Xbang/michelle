<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="$emit('cancel')">
        <Transition name="confirm-slide">
          <div v-if="visible" class="confirm-dialog" role="dialog" aria-modal="true">
            <h3 class="confirm-title">{{ title }}</h3>
            <p class="confirm-message">{{ message }}</p>
            <div class="confirm-actions">
              <button class="btn btn-primary" @click="$emit('confirm')">
                {{ t('common.confirm') }}
              </button>
              <button class="btn btn-outline" @click="$emit('cancel')">
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' }
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
/* Mobile-first: bottom panel by default */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: var(--color-surface, #fff);
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
  padding: var(--spacing-lg, 1.5rem);
  width: 100%;
  box-shadow: var(--shadow-lg, 0 4px 24px rgba(0, 0, 0, 0.15));
}

.confirm-title {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  margin-bottom: 0.75rem;
}

.confirm-message {
  font-size: var(--font-size-base, 1rem);
  color: var(--color-text-secondary, #4b5563);
  margin-bottom: var(--spacing-lg, 1.5rem);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-actions .btn {
  width: 100%;
  min-height: var(--touch-target-nav, 48px);
}

/* Slide-up transition for mobile */
.confirm-slide-enter-active,
.confirm-slide-leave-active {
  transition: transform var(--transition-slow, 300ms ease);
}

.confirm-slide-enter-from,
.confirm-slide-leave-to {
  transform: translateY(100%);
}

/* Overlay fade transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity var(--transition-normal, 200ms ease);
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

/* Desktop: centered dialog with horizontal buttons */
@media (min-width: 768px) {
  .confirm-overlay {
    align-items: center;
  }

  .confirm-dialog {
    border-radius: var(--radius-md, 8px);
    max-width: 400px;
    width: 90%;
  }

  .confirm-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .confirm-actions .btn {
    width: auto;
    min-height: auto;
  }
}
</style>
