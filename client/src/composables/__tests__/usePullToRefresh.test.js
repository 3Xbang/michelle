import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { usePullToRefresh } from '../usePullToRefresh.js';

function createTouchEvent(type, clientY) {
  return new TouchEvent(type, {
    touches: type === 'touchend' ? [] : [{ clientY, clientX: 0, identifier: 0, target: document.body, screenX: 0, screenY: 0, pageX: 0, pageY: 0, radiusX: 0, radiusY: 0, rotationAngle: 0, force: 0 }],
    changedTouches: [{ clientY, clientX: 0, identifier: 0, target: document.body, screenX: 0, screenY: 0, pageX: 0, pageY: 0, radiusX: 0, radiusY: 0, rotationAngle: 0, force: 0 }],
    bubbles: true,
  });
}

function createWrapper(onRefresh, threshold) {
  let composable;
  const Comp = defineComponent({
    setup() {
      composable = usePullToRefresh({ onRefresh, threshold });
      return { composable };
    },
    template: '<div ref="composable.containerRef" style="height:200px;overflow:auto;"><slot /></div>',
    // We need to bind the ref manually
  });

  // Use a more explicit approach to bind the template ref
  const WrapperComp = defineComponent({
    setup() {
      composable = usePullToRefresh({ onRefresh, threshold });
      return { ...composable };
    },
    template: '<div ref="containerRef" style="height:200px;overflow:auto;"><div style="height:100px;">content</div></div>',
  });

  const wrapper = mount(WrapperComp, { attachTo: document.body });
  return { wrapper, composable };
}

describe('usePullToRefresh', () => {
  let onRefresh;

  beforeEach(() => {
    onRefresh = vi.fn(() => Promise.resolve());
  });

  it('returns the expected reactive properties', async () => {
    const { wrapper, composable } = createWrapper(onRefresh);
    await nextTick();

    expect(composable.containerRef.value).toBeInstanceOf(HTMLElement);
    expect(composable.pullDistance.value).toBe(0);
    expect(composable.isRefreshing.value).toBe(false);
    expect(composable.isPulling.value).toBe(false);

    wrapper.unmount();
  });

  it('tracks pull distance on touchmove', async () => {
    const { wrapper, composable } = createWrapper(onRefresh);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    expect(composable.isPulling.value).toBe(true);

    el.dispatchEvent(createTouchEvent('touchmove', 150));
    expect(composable.pullDistance.value).toBe(50);

    el.dispatchEvent(createTouchEvent('touchmove', 180));
    expect(composable.pullDistance.value).toBe(80);

    wrapper.unmount();
  });

  it('does not track upward swipes (negative distance)', async () => {
    const { wrapper, composable } = createWrapper(onRefresh);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 200));
    el.dispatchEvent(createTouchEvent('touchmove', 150));
    expect(composable.pullDistance.value).toBe(0);

    wrapper.unmount();
  });

  it('triggers onRefresh when pull exceeds threshold and touch ends', async () => {
    const { wrapper, composable } = createWrapper(onRefresh, 60);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 170)); // 70px > 60px threshold
    expect(composable.pullDistance.value).toBe(70);

    el.dispatchEvent(createTouchEvent('touchend', 170));
    await flushPromises();

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(composable.isRefreshing.value).toBe(false);
    expect(composable.pullDistance.value).toBe(0);

    wrapper.unmount();
  });

  it('does NOT trigger onRefresh when pull is below threshold', async () => {
    const { wrapper, composable } = createWrapper(onRefresh, 60);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 140)); // 40px < 60px threshold
    el.dispatchEvent(createTouchEvent('touchend', 140));
    await flushPromises();

    expect(onRefresh).not.toHaveBeenCalled();
    expect(composable.pullDistance.value).toBe(0);

    wrapper.unmount();
  });

  it('uses default threshold of 60 when not specified', async () => {
    const { wrapper, composable } = createWrapper(onRefresh);
    await nextTick();

    const el = composable.containerRef.value;
    // Pull exactly 60px — should trigger
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 160));
    el.dispatchEvent(createTouchEvent('touchend', 160));
    await flushPromises();

    expect(onRefresh).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('sets isRefreshing=true while onRefresh is running', async () => {
    let resolveRefresh;
    const slowRefresh = vi.fn(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    const { wrapper, composable } = createWrapper(slowRefresh, 60);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 170));
    el.dispatchEvent(createTouchEvent('touchend', 170));

    // isRefreshing should be true while awaiting
    await nextTick();
    expect(composable.isRefreshing.value).toBe(true);

    resolveRefresh();
    await flushPromises();

    expect(composable.isRefreshing.value).toBe(false);
    expect(composable.pullDistance.value).toBe(0);

    wrapper.unmount();
  });

  it('ignores touch events while already refreshing', async () => {
    let resolveRefresh;
    const slowRefresh = vi.fn(() => new Promise((resolve) => { resolveRefresh = resolve; }));
    const { wrapper, composable } = createWrapper(slowRefresh, 60);
    await nextTick();

    const el = composable.containerRef.value;
    // First pull — triggers refresh
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 170));
    el.dispatchEvent(createTouchEvent('touchend', 170));
    await nextTick();
    expect(composable.isRefreshing.value).toBe(true);

    // Second pull while refreshing — should be ignored
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    expect(composable.isPulling.value).toBe(false);

    resolveRefresh();
    await flushPromises();

    expect(slowRefresh).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('resets isRefreshing even if onRefresh throws', async () => {
    const failingRefresh = vi.fn(() => Promise.reject(new Error('fail')));
    const { wrapper, composable } = createWrapper(failingRefresh, 60);
    await nextTick();

    const el = composable.containerRef.value;
    el.dispatchEvent(createTouchEvent('touchstart', 100));
    el.dispatchEvent(createTouchEvent('touchmove', 170));
    el.dispatchEvent(createTouchEvent('touchend', 170));
    await flushPromises();

    expect(composable.isRefreshing.value).toBe(false);
    expect(composable.pullDistance.value).toBe(0);

    wrapper.unmount();
  });
});
