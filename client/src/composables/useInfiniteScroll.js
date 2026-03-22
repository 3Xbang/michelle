import { ref, watch, onMounted, onUnmounted, isRef } from 'vue';

/**
 * Infinite scroll composable.
 * Listens for scroll events on a container (or window) and triggers a loadMore
 * callback when the user scrolls within `threshold` pixels of the bottom.
 *
 * @param {Object} options
 * @param {Function} options.loadMore - Async callback to load the next page
 * @param {import('vue').Ref<boolean>|Function} options.hasMore - Whether more data is available (ref or function)
 * @param {number} [options.threshold=200] - Distance from bottom in px to trigger loading
 * @returns {{ containerRef: import('vue').Ref }}
 */
export function useInfiniteScroll(options = {}) {
  const { loadMore, hasMore, threshold = 200 } = options;

  const containerRef = ref(null);
  let isLoading = false;

  function getHasMore() {
    if (isRef(hasMore)) return hasMore.value;
    if (typeof hasMore === 'function') return hasMore();
    return !!hasMore;
  }

  async function checkAndLoad() {
    if (isLoading || !getHasMore()) return;

    const el = containerRef.value;
    let shouldLoad = false;

    if (el) {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldLoad = remaining <= threshold;
    } else {
      // Default to window
      const remaining =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      shouldLoad = remaining <= threshold;
    }

    if (shouldLoad) {
      isLoading = true;
      try {
        await loadMore();
      } finally {
        isLoading = false;
      }
    }
  }

  function onScroll() {
    checkAndLoad();
  }

  let scrollTarget = null;

  function attach() {
    scrollTarget = containerRef.value || window;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
  }

  function detach() {
    if (scrollTarget) {
      scrollTarget.removeEventListener('scroll', onScroll);
      scrollTarget = null;
    }
  }

  // Re-attach when containerRef changes
  watch(containerRef, (newEl, oldEl) => {
    if (oldEl || (!oldEl && scrollTarget)) {
      detach();
    }
    if (newEl || !containerRef.value) {
      attach();
    }
  });

  onMounted(() => {
    attach();
  });

  onUnmounted(() => {
    detach();
  });

  return { containerRef };
}
