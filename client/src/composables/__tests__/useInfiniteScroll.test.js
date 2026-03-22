import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import { useInfiniteScroll } from '../useInfiniteScroll.js';

describe('useInfiniteScroll', () => {
  let scrollListeners;
  let originalAddEventListener;
  let originalRemoveEventListener;

  beforeEach(() => {
    scrollListeners = [];
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;

    window.addEventListener = vi.fn((event, handler, opts) => {
      if (event === 'scroll') {
        scrollListeners.push(handler);
      }
      originalAddEventListener.call(window, event, handler, opts);
    });

    window.removeEventListener = vi.fn((event, handler) => {
      if (event === 'scroll') {
        scrollListeners = scrollListeners.filter((h) => h !== handler);
      }
      originalRemoveEventListener.call(window, event, handler);
    });
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it('attaches scroll listener to window when no containerRef is set', async () => {
    const loadMore = vi.fn();
    const hasMore = ref(true);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({ loadMore, hasMore });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );

    wrapper.unmount();
  });

  it('cleans up scroll listener on unmount', async () => {
    const loadMore = vi.fn();
    const hasMore = ref(true);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({ loadMore, hasMore });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();
    wrapper.unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
  });

  it('calls loadMore when scrolled near bottom and hasMore is true (ref)', async () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);
    const hasMore = ref(true);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({
            loadMore,
            hasMore,
            threshold: 200,
          });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();

    // Simulate being near the bottom of the page
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 750,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 100,
      configurable: true,
    });

    // Trigger scroll
    for (const handler of scrollListeners) {
      handler();
    }

    await nextTick();
    expect(loadMore).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('does not call loadMore when hasMore is false', async () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);
    const hasMore = ref(false);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({
            loadMore,
            hasMore,
            threshold: 200,
          });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 850,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 100,
      configurable: true,
    });

    for (const handler of scrollListeners) {
      handler();
    }

    await nextTick();
    expect(loadMore).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('does not call loadMore when far from bottom', async () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);
    const hasMore = ref(true);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({
            loadMore,
            hasMore,
            threshold: 200,
          });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 100,
      configurable: true,
    });

    for (const handler of scrollListeners) {
      handler();
    }

    await nextTick();
    expect(loadMore).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('supports hasMore as a function', async () => {
    const loadMore = vi.fn().mockResolvedValue(undefined);
    const hasMoreFn = () => true;

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({
            loadMore,
            hasMore: hasMoreFn,
            threshold: 200,
          });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 850,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 100,
      configurable: true,
    });

    for (const handler of scrollListeners) {
      handler();
    }

    await nextTick();
    expect(loadMore).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('prevents duplicate calls while loadMore is running', async () => {
    let resolveLoad;
    const loadMore = vi.fn(
      () => new Promise((resolve) => { resolveLoad = resolve; })
    );
    const hasMore = ref(true);

    const wrapper = mount(
      defineComponent({
        setup() {
          const { containerRef } = useInfiniteScroll({
            loadMore,
            hasMore,
            threshold: 200,
          });
          return { containerRef };
        },
        template: '<div></div>',
      })
    );

    await nextTick();

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 850,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 100,
      configurable: true,
    });

    // First scroll triggers loadMore
    for (const handler of scrollListeners) {
      handler();
    }
    await nextTick();
    expect(loadMore).toHaveBeenCalledTimes(1);

    // Second scroll while still loading — should NOT trigger again
    for (const handler of scrollListeners) {
      handler();
    }
    await nextTick();
    expect(loadMore).toHaveBeenCalledTimes(1);

    // Resolve the first load
    resolveLoad();
    await nextTick();

    // Now a third scroll should trigger again
    for (const handler of scrollListeners) {
      handler();
    }
    await nextTick();
    expect(loadMore).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });
});
