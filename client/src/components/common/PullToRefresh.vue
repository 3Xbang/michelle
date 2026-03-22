<template>
  <div ref="containerRef" class="pull-to-refresh">
    <div
      class="pull-indicator"
      :style="{ transform: `translateY(${indicatorOffset}px)`, opacity: indicatorOpacity }"
    >
      <div class="spinner" :class="{ spinning: isActive }"></div>
    </div>
    <div
      class="pull-content"
      :style="{ transform: `translateY(${contentOffset}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { usePullToRefresh } from '../../composables/usePullToRefresh.js'

const props = defineProps({
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['refresh'])

const { containerRef, pullDistance, isRefreshing, isPulling } = usePullToRefresh({
  onRefresh: () => {
    emit('refresh')
  },
  threshold: 60
})

const isActive = computed(() => props.loading || isRefreshing.value)

const indicatorOffset = computed(() => {
  if (props.disabled) return -40
  if (isActive.value) return 8
  const dist = Math.min(pullDistance.value, 100)
  return dist > 0 ? dist - 40 : -40
})

const indicatorOpacity = computed(() => {
  if (props.disabled) return 0
  if (isActive.value) return 1
  const dist = pullDistance.value
  if (dist <= 0) return 0
  return Math.min(dist / 60, 1)
})

const contentOffset = computed(() => {
  if (props.disabled) return 0
  if (isActive.value) return 48
  return Math.min(pullDistance.value, 100)
})

// When parent sets loading=false after refresh completes, reset pull state
watch(() => props.loading, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    pullDistance.value = 0
    isRefreshing.value = false
  }
})
</script>

<style scoped>
.pull-to-refresh {
  position: relative;
  overflow: hidden;
  min-height: 100%;
}

.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  transition: opacity var(--transition-fast);
  pointer-events: none;
  z-index: 10;
}

.pull-content {
  transition: transform var(--transition-fast);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
}

.spinner.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
