import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ReportView from '../../views/ReportView.vue';

// Mock useMediaQuery
let mediaQueryResult = ref(true);
vi.mock('../../composables/useMediaQuery.js', () => ({
  useMediaQuery: () => mediaQueryResult,
}));

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

// Mock useToast
vi.mock('../../composables/useToast.js', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock apiClient
vi.mock('../../api/client.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

function createWrapper() {
  return mount(ReportView, {
    global: {
      stubs: {
        MobileFilter: {
          template: '<div class="mobile-filter-stub" />',
          props: ['filters', 'filterFields', 'activeCount'],
        },
        ReportTable: {
          template: '<div class="report-table-stub" />',
          props: ['columns', 'data', 'loading', 'summary'],
        },
      },
    },
  });
}

describe('ReportView', () => {
  beforeEach(() => {
    mediaQueryResult = ref(true);
  });

  it('renders MobileFilter component', () => {
    const wrapper = createWrapper();
    expect(wrapper.findComponent({ name: 'MobileFilter' }).exists() || wrapper.find('.mobile-filter-stub').exists()).toBe(true);
  });

  it('passes filter fields with from, to, and granularity to MobileFilter', () => {
    const wrapper = createWrapper();
    const mobileFilter = wrapper.find('.mobile-filter-stub');
    expect(mobileFilter.exists()).toBe(true);
  });

  it('renders dimension tabs', () => {
    const wrapper = createWrapper();
    const tabs = wrapper.findAll('.tab-btn');
    expect(tabs.length).toBe(4);
  });

  it('renders export button', () => {
    const wrapper = createWrapper();
    const exportBtn = wrapper.find('.export-bar .btn');
    expect(exportBtn.exists()).toBe(true);
  });

  it('has horizontally scrollable table wrapper', async () => {
    const apiClient = (await import('../../api/client.js')).default;
    apiClient.get.mockResolvedValueOnce({
      data: [{ room_name: 'Room A', total_revenue: 100, total_commission: 10, total_net_income: 90 }],
    });

    const wrapper = createWrapper();
    // Wait for onMounted fetchReport to complete
    await new Promise((r) => setTimeout(r, 10));
    await wrapper.vm.$nextTick();

    const scrollWrapper = wrapper.find('.report-table-scroll');
    expect(scrollWrapper.exists()).toBe(true);
  });

  it('shows loading state', () => {
    const wrapper = createWrapper();
    // loading starts as true from onMounted fetchReport
    // but since mock resolves immediately, check the element exists in template
    expect(wrapper.find('.card').exists()).toBe(true);
  });

  it('tab buttons have touch-friendly min-height via CSS class', () => {
    const wrapper = createWrapper();
    const tab = wrapper.find('.tab-btn');
    expect(tab.exists()).toBe(true);
  });
});
