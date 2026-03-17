<template>
  <div class="form-group">
    <label v-if="label" class="form-label">
      {{ label }}
      <span v-if="required" class="form-required">*</span>
    </label>
    <slot />
    <p v-if="error" class="form-error">{{ error }}</p>
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
.form-required {
  color: #dc2626;
  margin-left: 2px;
}
</style>
