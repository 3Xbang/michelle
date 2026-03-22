<template>
  <svg :width="size" :height="size" :aria-hidden="true">
    <use :href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 }
})
</script>
