<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay" @click.self="$emit('cancel')">
      <div class="confirm-dialog" role="dialog" aria-modal="true">
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button class="btn btn-outline" @click="$emit('cancel')">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" @click="$emit('confirm')">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
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
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
}

.confirm-message {
  font-size: 0.875rem;
  color: #4b5563;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
