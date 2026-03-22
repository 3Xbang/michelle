<template>
  <button
    class="fab"
    :aria-label="label"
    @click="handleClick"
  >
    <SvgIcon :name="icon" :size="24" />
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import SvgIcon from '../icons/SvgIcon.vue'

const props = defineProps({
  to: { type: String, required: true },
  icon: { type: String, default: 'plus' },
  label: { type: String, required: true }
})

const router = useRouter()

function handleClick() {
  router.push(props.to)
}
</script>

<style scoped>
.fab {
  position: fixed;
  right: 16px;
  bottom: calc(var(--bottom-nav-height) + 16px);
  width: var(--fab-size);
  height: var(--fab-size);
  border-radius: 50%;
  background: var(--color-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
  z-index: 100;
  transition: background var(--transition-fast), box-shadow var(--transition-fast);
}

.fab:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

.fab svg {
  color: #ffffff;
  fill: #ffffff;
}

@media (min-width: 768px) {
  .fab {
    display: none;
  }
}
</style>
