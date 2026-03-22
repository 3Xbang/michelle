import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MoreMenuView from '../../views/MoreMenuView.vue';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const map = {
        'nav.more': '更多',
        'nav.rooms': '房间管理',
        'nav.reports': '报表',
        'nav.config': '系统配置',
        'nav.users': '用户管理',
      };
      return map[key] || key;
    },
  }),
}));

function mountView() {
  return mount(MoreMenuView, {
    global: {
      stubs: {
        SvgIcon: {
          template: '<svg :data-icon="name" :data-size="size"></svg>',
          props: ['name', 'size'],
        },
        'router-link': {
          template: '<a :href="to" class="menu-item"><slot /></a>',
          props: ['to'],
        },
      },
    },
  });
}

describe('MoreMenuView', () => {
  it('renders a 2×2 grid with 4 menu items', () => {
    const wrapper = mountView();
    const items = wrapper.findAll('.menu-item');
    expect(items.length).toBe(4);
  });

  it('renders correct routes for each menu item', () => {
    const wrapper = mountView();
    const items = wrapper.findAll('.menu-item');
    const hrefs = items.map((item) => item.attributes('href'));
    expect(hrefs).toEqual(['/rooms', '/reports', '/config', '/users']);
  });

  it('each menu item contains an SvgIcon with size 32', () => {
    const wrapper = mountView();
    const icons = wrapper.findAll('svg');
    expect(icons.length).toBe(4);
    icons.forEach((icon) => {
      expect(icon.attributes('data-size')).toBe('32');
    });
  });

  it('renders correct icon names', () => {
    const wrapper = mountView();
    const icons = wrapper.findAll('svg');
    const names = icons.map((icon) => icon.attributes('data-icon'));
    expect(names).toEqual(['room', 'report', 'config', 'users']);
  });

  it('each menu item contains a Chinese label', () => {
    const wrapper = mountView();
    const labels = wrapper.findAll('.menu-label');
    expect(labels.length).toBe(4);
    expect(labels[0].text()).toBe('房间管理');
    expect(labels[1].text()).toBe('报表');
    expect(labels[2].text()).toBe('系统配置');
    expect(labels[3].text()).toBe('用户管理');
  });

  it('renders the page title', () => {
    const wrapper = mountView();
    expect(wrapper.find('.page-title').text()).toBe('更多');
  });

  it('menu-grid uses CSS grid with 2 columns', () => {
    const wrapper = mountView();
    const grid = wrapper.find('.menu-grid');
    expect(grid.exists()).toBe(true);
  });
});
