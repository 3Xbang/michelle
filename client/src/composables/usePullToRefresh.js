import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Pull-to-refresh composable.
 * Listens for touch gestures on a container element and triggers a refresh callback
 * when the user pulls down beyond the threshold and releases.
 *
 * @param {Object} options
 * @param {Function} options.onRefresh - Async callback to invoke on refresh
 * @param {number} [options.threshold=60] - Pull distance in px required to trigger refresh
 * @returns {{ containerRef: import('vue').Ref, pullDistance: import('vue').Ref<number>, isRefreshing: import('vue').Ref<boolean>, isPulling: import('vue').Ref<boolean> }}
 */
export function usePullToRefresh(options = {}) {
  const { onRefresh, threshold = 60 } = options;

  const containerRef = ref(null);
  const pullDistance = ref(0);
  const isRefreshing = ref(false);
  const isPulling = ref(false);

  let startY = 0;

  function onTouchStart(e) {
    if (isRefreshing.value) return;
    const el = containerRef.value;
    if (el && el.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    isPulling.value = true;
  }

  function onTouchMove(e) {
    if (!isPulling.value || isRefreshing.value) return;
    const el = containerRef.value;
    if (el && el.scrollTop > 0) {
      // User scrolled down then tried to pull — ignore
      pullDistance.value = 0;
      return;
    }
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    if (distance > 0) {
      pullDistance.value = distance;
    } else {
      pullDistance.value = 0;
    }
  }

  async function onTouchEnd() {
    if (!isPulling.value || isRefreshing.value) return;
    isPulling.value = false;

    if (pullDistance.value >= threshold && typeof onRefresh === 'function') {
      isRefreshing.value = true;
      try {
        await onRefresh();
      } catch {
        // Error handling is the caller's responsibility (e.g. show a Toast).
        // We just ensure state is reset.
      } finally {
        isRefreshing.value = false;
        pullDistance.value = 0;
      }
    } else {
      pullDistance.value = 0;
    }
  }

  onMounted(() => {
    const el = containerRef.value;
    if (!el) return;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
  });

  onUnmounted(() => {
    const el = containerRef.value;
    if (!el) return;
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  });

  return { containerRef, pullDistance, isRefreshing, isPulling };
}
