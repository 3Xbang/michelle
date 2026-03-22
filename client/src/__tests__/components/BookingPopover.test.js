import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import BookingPopover from '../../components/calendar/BookingPopover.vue';

// Mock useMediaQuery
const mockIsDesktop = ref(true);
vi.mock('../../composables/useMediaQuery', () => ({
  useMediaQuery: () => mockIsDesktop,
}));

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

const defaultBooking = {
  id: 1,
  guest_name: 'John Doe',
  check_in: '2024-01-01',
  check_out: '2024-01-05',
  platform_source: 'Airbnb',
  booking_status: 'confirmed',
};

function createWrapper(props = {}) {
  return mount(BookingPopover, {
    props: {
      booking: defaultBooking,
      visible: true,
      position: { x: 100, y: 200 },
      ...props,
    },
    global: {
      stubs: {
        Teleport: true,
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  });
}

describe('BookingPopover', () => {
  beforeEach(() => {
    mockIsDesktop.value = true;
  });

  describe('Desktop mode (≥ 768px)', () => {
    it('renders as absolute positioned popover', () => {
      const wrapper = createWrapper();
      const card = wrapper.find('.popover-card');
      expect(card.exists()).toBe(true);
      expect(card.classes()).not.toContain('popover-card--drawer');
    });

    it('applies position style on desktop', () => {
      const wrapper = createWrapper({ position: { x: 150, y: 250 } });
      const card = wrapper.find('.popover-card');
      expect(card.attributes('style')).toContain('left: 150px');
      expect(card.attributes('style')).toContain('top: 250px');
    });

    it('does not show mobile overlay background', () => {
      const wrapper = createWrapper();
      const overlay = wrapper.find('.popover-overlay');
      expect(overlay.classes()).not.toContain('popover-overlay--mobile');
    });
  });

  describe('Mobile mode (< 768px)', () => {
    beforeEach(() => {
      mockIsDesktop.value = false;
    });

    it('renders as bottom drawer with drawer class', () => {
      const wrapper = createWrapper();
      const card = wrapper.find('.popover-card');
      expect(card.exists()).toBe(true);
      expect(card.classes()).toContain('popover-card--drawer');
    });

    it('does not apply position style on mobile', () => {
      const wrapper = createWrapper({ position: { x: 150, y: 250 } });
      const card = wrapper.find('.popover-card');
      const style = card.attributes('style');
      // In mobile mode, style should be undefined (no inline positioning)
      expect(style).toBeUndefined();
    });

    it('shows mobile overlay background', () => {
      const wrapper = createWrapper();
      const overlay = wrapper.find('.popover-overlay');
      expect(overlay.classes()).toContain('popover-overlay--mobile');
    });

    it('emits close when overlay is clicked', async () => {
      const wrapper = createWrapper();
      const overlay = wrapper.find('.popover-overlay');
      await overlay.trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Common behavior', () => {
    it('does not render when visible is false', () => {
      const wrapper = createWrapper({ visible: false });
      expect(wrapper.find('.popover-overlay').exists()).toBe(false);
    });

    it('displays booking information', () => {
      const wrapper = createWrapper();
      expect(wrapper.text()).toContain('John Doe');
      expect(wrapper.text()).toContain('2024-01-01');
      expect(wrapper.text()).toContain('2024-01-05');
      expect(wrapper.text()).toContain('Airbnb');
    });

    it('emits close when close button is clicked', async () => {
      const wrapper = createWrapper();
      await wrapper.find('.popover-close').trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
