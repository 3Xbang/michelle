import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import DataTable from '../../components/common/DataTable.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      common: { loading: 'Loading...', noData: 'No data' },
      pagination: {
        total: 'Total: {total}',
        page: 'Page {page}',
      },
    },
  },
});

const mockRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/bookings/:id', component: { template: '<div />' } },
  ],
});

function mountDataTable(props = {}, slots = {}) {
  return mount(DataTable, {
    props: {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
      ],
      ...props,
    },
    slots,
    global: {
      plugins: [i18n, mockRouter],
      stubs: {
        SvgIcon: {
          template: '<svg data-testid="svg-icon" :data-name="name" />',
          props: ['name', 'size'],
        },
      },
    },
  });
}

describe('DataTable', () => {
  describe('Table Mode (cardMode=false)', () => {
    it('renders a table when cardMode is false', () => {
      const wrapper = mountDataTable({
        data: [{ name: 'Alice', status: 'active' }],
      });
      expect(wrapper.find('table.data-table').exists()).toBe(true);
      expect(wrapper.find('.card-list').exists()).toBe(false);
    });

    it('renders table headers from columns', () => {
      const wrapper = mountDataTable({
        data: [{ name: 'Alice', status: 'active' }],
      });
      const headers = wrapper.findAll('th');
      expect(headers).toHaveLength(2);
      expect(headers[0].text()).toBe('Name');
      expect(headers[1].text()).toBe('Status');
    });

    it('renders table rows from data', () => {
      const wrapper = mountDataTable({
        data: [
          { name: 'Alice', status: 'active' },
          { name: 'Bob', status: 'pending' },
        ],
      });
      const rows = wrapper.findAll('tbody tr');
      expect(rows).toHaveLength(2);
    });

    it('shows empty state with SvgIcon when data is empty', () => {
      const wrapper = mountDataTable({ data: [] });
      const emptyContent = wrapper.find('.table-empty-content');
      expect(emptyContent.exists()).toBe(true);
      expect(emptyContent.find('[data-testid="svg-icon"]').exists()).toBe(true);
      expect(emptyContent.find('.empty-text').exists()).toBe(true);
    });

    it('shows loading state', () => {
      const wrapper = mountDataTable({ loading: true, data: [] });
      expect(wrapper.find('.table-loading').exists()).toBe(true);
    });

    it('shows pagination when total > 0', () => {
      const wrapper = mountDataTable({
        data: [{ name: 'Alice', status: 'active' }],
        total: 50,
        page: 1,
        pageSize: 20,
      });
      expect(wrapper.find('.pagination').exists()).toBe(true);
    });
  });

  describe('Card Mode (cardMode=true)', () => {
    const cardProps = {
      cardMode: true,
      cardTitleKey: 'name',
      cardSubtitleKey: 'room',
      cardStatusKey: 'status',
      cardLinkFn: (row) => `/bookings/${row.id}`,
    };

    it('renders card list when cardMode is true', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
      });
      expect(wrapper.find('.card-list').exists()).toBe(true);
      expect(wrapper.find('table.data-table').exists()).toBe(false);
    });

    it('renders card title from cardTitleKey', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
      });
      expect(wrapper.find('.card-item-title').text()).toBe('Alice');
    });

    it('renders card subtitle from cardSubtitleKey', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
      });
      expect(wrapper.find('.card-item-subtitle').text()).toBe('Room A');
    });

    it('renders status badge from cardStatusKey', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
      });
      const badge = wrapper.find('.status-badge');
      expect(badge.exists()).toBe(true);
      expect(badge.classes()).toContain('status-pending');
    });

    it('renders multiple cards for multiple data items', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [
          { id: 1, name: 'Alice', room: 'Room A', status: 'pending' },
          { id: 2, name: 'Bob', room: 'Room B', status: 'active' },
        ],
      });
      expect(wrapper.findAll('.card-item')).toHaveLength(2);
    });

    it('navigates on card click using cardLinkFn', async () => {
      const pushSpy = vi.spyOn(mockRouter, 'push');
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
      });
      await wrapper.find('.card-item').trigger('click');
      expect(pushSpy).toHaveBeenCalledWith('/bookings/1');
      pushSpy.mockRestore();
    });

    it('shows empty state with SvgIcon when data is empty in card mode', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [],
      });
      const empty = wrapper.find('.card-list-empty');
      expect(empty.exists()).toBe(true);
      expect(empty.find('[data-testid="svg-icon"]').exists()).toBe(true);
      expect(empty.find('.empty-text').exists()).toBe(true);
    });

    it('shows loading state in card mode', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        loading: true,
        data: [],
      });
      expect(wrapper.find('.card-list-empty').text()).toContain('Loading...');
    });

    it('does not show pagination in card mode', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: 'pending' }],
        total: 50,
      });
      expect(wrapper.find('.pagination').exists()).toBe(false);
    });

    it('hides subtitle when cardSubtitleKey field is empty', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: '', status: 'pending' }],
      });
      expect(wrapper.find('.card-item-subtitle').exists()).toBe(false);
    });

    it('hides status badge when cardStatusKey field is empty', () => {
      const wrapper = mountDataTable({
        ...cardProps,
        data: [{ id: 1, name: 'Alice', room: 'Room A', status: '' }],
      });
      expect(wrapper.find('.status-badge').exists()).toBe(false);
    });
  });
});
