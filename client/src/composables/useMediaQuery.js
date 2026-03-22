import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Reactive media query composable.
 * @param {string} query - CSS media query string, e.g. '(min-width: 1024px)'
 * @returns {import('vue').Ref<boolean>} Reactive boolean that tracks the media query match state
 */
export function useMediaQuery(query) {
  const matches = ref(false);
  let mediaQueryList = null;
  let handler = null;

  onMounted(() => {
    mediaQueryList = window.matchMedia(query);
    matches.value = mediaQueryList.matches;

    handler = (event) => {
      matches.value = event.matches;
    };

    mediaQueryList.addEventListener('change', handler);
  });

  onUnmounted(() => {
    if (mediaQueryList && handler) {
      mediaQueryList.removeEventListener('change', handler);
    }
  });

  return matches;
}
