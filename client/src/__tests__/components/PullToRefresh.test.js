import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PullToRefresh from '../../components/common/PullToRefresh.vue';

// Mock usePullToRefresh composable
let mockPullDistance;
let mockIsRefreshing;
let mockIsPulling;
let mockContainerRef;
let capturedOnRefresh;

vi.mock('../../composables/usePullToRefresh', () => ({
  usePullToRefresh: (options) => {
    const { ref } = require('vue');
    capturedOnRefresh = options.onRefresh;
    mockContainerRef = ref(null);
    mockPullDistance = ref(0);
    mockIsRefreshing = ref(false);
    mockIsPulling = ref(false);
    return {
      containerRef: mockContainerRef,
      pullDistance: mockPullDistance,
      isRefreshing: mockIsRefreshing,
      isPulling: mockIsPulling,
    };
  },
}));

function mountComponent(props = {}, slots = {}) {
  return mount(PullToRefresh, {
    props: {
      loading: false,
      disabled: false,
      ...props,
    },
    slots: {
      default: slots.default || '<div class="test-content">Content</div>',
    },
  });
}

describe('PullToRefresh', () => {
  beforeEach(() => {
    capturedOnRefresh = null;
  });

  it('renders the default slot content', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.test-content').exists()).toBe(true);
    expect(wrapper.find('.test-content').text()).toBe('Content');
  });

  it('renders the pull indicator and spinner', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.pull-indicator').exists()).toBe(true);
    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows spinning animation when loading prop is true', () => {
    const wrapper = mountComponent({ loading: true });
    expect(wrapper.find('.spinner.spinning').exists()).toBe(true);
  });

  it('shows spinning animation when isRefreshing is true', async () => {
    const wrapper = mountComponent();
    mockIsRefreshing.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.spinner.spinning').exists()).toBe(true);
  });

  it('does not show spinning when not loading and not refreshing', () => {
    const wrapper = mountComponent({ loading: false });
    expect(wrapper.find('.spinner.spinning').exists()).toBe(false);
  });

  it('emits refresh event when onRefresh callback is invoked', () => {
    const wrapper = mountComponent();
    expect(capturedOnRefresh).toBeTypeOf('function');
    capturedOnRefresh();
    expect(wrapper.emitted('refresh')).toBeTruthy();
    expect(wrapper.emitted('refresh').length).toBe(1);
  });

  it('indicator is hidden (negative offset) when disabled', () => {
    const wrapper = mountComponent({ disabled: true });
    const indicator = wrapper.find('.pull-indicator');
    expect(indicator.attributes('style')).toContain('translateY(-40px)');
    expect(indicator.attributes('style')).toContain('opacity: 0');
  });

  it('indicator moves down based on pullDistance', async () => {
    const wrapper = mountComponent();
    mockPullDistance.value = 80;
    await wrapper.vm.$nextTick();
    const indicator = wrapper.find('.pull-indicator');
    // offset = min(80, 100) - 40 = 40
    expect(indicator.attributes('style')).toContain('translateY(40px)');
  });

  it('content offset is 0 when disabled', () => {
    const wrapper = mountComponent({ disabled: true });
    const content = wrapper.find('.pull-content');
    expect(content.attributes('style')).toContain('translateY(0px)');
  });

  it('content translates down during pull', async () => {
    const wrapper = mountComponent();
    mockPullDistance.value = 50;
    await wrapper.vm.$nextTick();
    const content = wrapper.find('.pull-content');
    expect(content.attributes('style')).toContain('translateY(50px)');
  });

  it('content offset is capped at 100px', async () => {
    const wrapper = mountComponent();
    mockPullDistance.value = 200;
    await wrapper.vm.$nextTick();
    const content = wrapper.find('.pull-content');
    expect(content.attributes('style')).toContain('translateY(100px)');
  });

  it('indicator shows at fixed position when loading', () => {
    const wrapper = mountComponent({ loading: true });
    const indicator = wrapper.find('.pull-indicator');
    expect(indicator.attributes('style')).toContain('translateY(8px)');
    expect(indicator.attributes('style')).toContain('opacity: 1');
  });

  it('has the container wrapper with pull-to-refresh class', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.pull-to-refresh').exists()).toBe(true);
  });
});
