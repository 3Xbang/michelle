<template>
  <div class="form-field">
    <label v-if="label" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required">*</span>
    </label>
    <div class="form-field__control">
      <slot />
    </div>
    <p v-if="error" class="form-field__error">{{ error }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false }
});
</script>

<style scoped>
.form-field {
  margin-bottom: var(--spacing-md);
  width: 100%;
}

.form-field__label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.form-field__required {
  color: var(--color-danger);
  margin-left: 2px;
}

.form-field__control :deep(input),
.form-field__control :deep(select),
.form-field__control :deep(textarea) {
  width: 100%;
  min-height: var(--touch-target-nav);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-field__control :deep(input:focus),
.form-field__control :deep(select:focus),
.form-field__control :deep(textarea:focus) {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-field__error {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

@media (max-width: 639px) {
  .form-field {
    width: 100%;
  }
}
</style>
