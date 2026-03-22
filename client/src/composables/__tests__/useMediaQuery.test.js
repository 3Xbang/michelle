import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useMediaQuery } from '../useMediaQuery.js';

function createMockMatchMedia(initialMatches) {
  let listener = null;
  const mql = {
    matches: initialMatches,
    addEventListener: vi.fn((event, cb) => { listener = cb; }),
    removeEventListener: vi.fn((event, cb) => { listener = null; }),
  };
  return {
    mql,
    trigger(matches) {
      mql.matches = matches;
      if (listener) listener({ matches });
    },
  };
}

describe('useMediaQuery', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns a ref that reflects the initial matchMedia state (true)', async () => {
    const { mql } = createMockMatchMedia(true);
    window.matchMedia = vi.fn(() => mql);

    let result;
    const wrapper = mount(defineComponent({
      setup() {
        result = useMediaQuery('(min-width: 1024px)');
        return { result };
      },
      template: '<div>{{ result }}</div>',
    }));

    await nextTick();
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('returns a ref that reflects the initial matchMedia state (false)', async () => {
    const { mql } = createMockMatchMedia(false);
    window.matchMedia = vi.fn(() => mql);

    let result;
    const wrapper = mount(defineComponent({
      setup() {
        result = useMediaQuery('(min-width: 1024px)');
        return { result };
      },
      template: '<div>{{ result }}</div>',
    }));

    await nextTick();
    expect(result.value).toBe(false);
    wrapper.unmount();
  });

  it('updates reactively when the media query changes', async () => {
    const { mql, trigger } = createMockMatchMedia(false);
    window.matchMedia = vi.fn(() => mql);

    let result;
    const wrapper = mount(defineComponent({
      setup() {
        result = useMediaQuery('(min-width: 768px)');
        return { result };
      },
      template: '<div>{{ result }}</div>',
    }));

    await nextTick();
    expect(result.value).toBe(false);

    trigger(true);
    await nextTick();
    expect(result.value).toBe(true);

    trigger(false);
    await nextTick();
    expect(result.value).toBe(false);

    wrapper.unmount();
  });

  it('cleans up the event listener on unmount', async () => {
    const { mql } = createMockMatchMedia(true);
    window.matchMedia = vi.fn(() => mql);

    const wrapper = mount(defineComponent({
      setup() {
        const result = useMediaQuery('(min-width: 1024px)');
        return { result };
      },
      template: '<div>{{ result }}</div>',
    }));

    await nextTick();
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
