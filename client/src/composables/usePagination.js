import { ref, computed } from 'vue';

export function usePagination(defaultPageSize = 20) {
  const page = ref(1);
  const pageSize = ref(defaultPageSize);
  const total = ref(0);

  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.ceil(total.value / pageSize.value) : 0
  );

  function goToPage(p) {
    if (p >= 1 && p <= totalPages.value) {
      page.value = p;
    }
  }

  function setTotal(t) {
    total.value = t;
    // Reset to last valid page if current page exceeds total
    if (page.value > totalPages.value && totalPages.value > 0) {
      page.value = totalPages.value;
    }
  }

  function reset() {
    page.value = 1;
    total.value = 0;
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    goToPage,
    setTotal,
    reset,
  };
}
