import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import MobileFilter from '../../components/common/MobileFilter.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: {
        filter: 'Filter',
        apply: 'Apply',
        reset: 'Reset',
        all: 'All',
      },
    },
  },
});

const sampleFields = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'active', label: 'Active' },
    ],
  },
  {
    key: 'from',
    label: 'From',
    type: 'date',
  },
];

// Mock useMediaQuery to control desktop/mobile mode
let mockIsDesktop = false;
vi.mock('../../composables/useMediaQuery', () => ({
  useMediaQuery: () => {
    const { ref } = require('vue');
    return ref(mockIsDesktop);
  },
}));

function mountFilter(props = {}) {
  return mount(MobileFilter, {
    props: {
      filterFields: sampleFields,
      filters: {},
      activeCount: 0,
      ...props,
    },
    global: {
      plugins: [i18n],
      stubs: {
        SvgIcon: {
          template: '<svg data-testid="svg-icon" :data-name="name" />',
          props: ['name', 'size'],
        },
        Teleport: true,
      },
    },
  });
}

describe('MobileFilter', () => {
  beforeEach(() => {
    mockIsDesktop = false;
  });

  describe('Mobile mode (< 768px)', () => {
    it('renders a filter button with filter icon and chevron', () => {
      const wrapper = mountFilter();
      const btn = wrapper.find('.mobile-filter__btn');
      expect(btn.exists()).toBe(true);
      expect(btn.text()).toContain('Filter');
      const icons = btn.findAll('[data-testid="svg-icon"]');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });

    it('shows badge when activeCount > 0', () => {
      const wrapper = mountFilter({ activeCount: 3 });
      const badge = wrapper.find('.mobile-filter__badge');
      expect(badge.exists()).toBe(true);
      expect(badge.text()).toBe('3');
    });

    it('does not show badge when activeCount is 0', () => {
      const wrapper = mountFilter({ activeCount: 0 });
      expect(wrapper.find('.mobile-filter__badge').exists()).toBe(false);
    });

    it('toggles drawer open on button click', async () => {
      const wrapper = mountFilter();
      await wrapper.find('.mobile-filter__btn').trigger('click');
      // When drawer is open, the button's chevron should switch to chevron-up
      const btnIcons = wrapper.find('.mobile-filter__btn').findAll('[data-testid="svg-icon"]');
      const chevronIcon = btnIcons[btnIcons.length - 1];
      expect(chevronIcon.attributes('data-name')).toBe('chevron-up');
    });

    it('does not render desktop filter-bar', () => {
      const wrapper = mountFilter();
      expect(wrapper.find('.filter-bar').exists()).toBe(false);
    });

    it('emits reset event when reset is called', async () => {
      const wrapper = mountFilter({ filters: { status: 'pending', from: '2024-01-01' } });
      // Open drawer
      await wrapper.find('.mobile-filter__btn').trigger('click');
      // Call handleReset via component internals
      wrapper.vm.handleReset();
      expect(wrapper.emitted('reset')).toBeTruthy();
    });

    it('emits apply event with filter values', () => {
      const wrapper = mountFilter({ filters: { status: 'pending', from: '2024-01-01' } });
      wrapper.vm.handleApply();
      expect(wrapper.emitted('apply')).toBeTruthy();
      expect(wrapper.emitted('apply')[0][0]).toEqual({ status: 'pending', from: '2024-01-01' });
    });
  });

  describe('Desktop mode (>= 768px)', () => {
    beforeEach(() => {
      mockIsDesktop = true;
    });

    it('renders horizontal filter-bar', () => {
      const wrapper = mountFilter();
      expect(wrapper.find('.filter-bar').exists()).toBe(true);
      expect(wrapper.find('.mobile-filter').exists()).toBe(false);
    });

    it('renders filter fields inline', () => {
      const wrapper = mountFilter();
      const items = wrapper.findAll('.filter-item');
      // 2 fields + 1 actions item
      expect(items.length).toBe(3);
    });

    it('renders select options for select-type fields', () => {
      const wrapper = mountFilter();
      const select = wrapper.find('.form-select');
      expect(select.exists()).toBe(true);
      const options = select.findAll('option');
      // "All" + 2 options
      expect(options.length).toBe(3);
    });

    it('renders input for non-select fields', () => {
      const wrapper = mountFilter();
      const input = wrapper.find('input.form-input');
      expect(input.exists()).toBe(true);
      expect(input.attributes('type')).toBe('date');
    });

    it('emits apply on desktop field change', async () => {
      const wrapper = mountFilter();
      const select = wrapper.find('.form-select');
      await select.setValue('active');
      await select.trigger('change');
      expect(wrapper.emitted('apply')).toBeTruthy();
    });

    it('emits reset on reset button click', async () => {
      const wrapper = mountFilter();
      const resetBtn = wrapper.find('.btn-outline');
      await resetBtn.trigger('click');
      expect(wrapper.emitted('reset')).toBeTruthy();
    });
  });
});
