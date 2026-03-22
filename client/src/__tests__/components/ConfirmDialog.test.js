import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmDialog from '../../components/common/ConfirmDialog.vue';

function mountDialog(props = {}) {
  return mount(ConfirmDialog, {
    props: {
      visible: true,
      title: 'Confirm Action',
      message: 'Are you sure?',
      ...props,
    },
    global: {
      stubs: {
        Teleport: true,
      },
      mocks: {
        $t: (key) => key,
      },
      plugins: [
        {
          install(app) {
            app.config.globalProperties.$t = (key) => {
              const map = {
                'common.confirm': '确认',
                'common.cancel': '取消',
              };
              return map[key] || key;
            };
          },
        },
      ],
    },
  });
}

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const map = {
        'common.confirm': '确认',
        'common.cancel': '取消',
      };
      return map[key] || key;
    },
  }),
}));

describe('ConfirmDialog', () => {
  it('renders nothing when visible is false', () => {
    const wrapper = mountDialog({ visible: false });
    expect(wrapper.find('.confirm-overlay').exists()).toBe(false);
  });

  it('renders overlay and dialog when visible is true', () => {
    const wrapper = mountDialog({ visible: true });
    expect(wrapper.find('.confirm-overlay').exists()).toBe(true);
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true);
  });

  it('displays the title and message', () => {
    const wrapper = mountDialog({ title: 'Delete Item', message: 'This cannot be undone.' });
    expect(wrapper.find('.confirm-title').text()).toBe('Delete Item');
    expect(wrapper.find('.confirm-message').text()).toBe('This cannot be undone.');
  });

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mountDialog();
    await wrapper.find('.btn-primary').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountDialog();
    await wrapper.find('.btn-outline').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when overlay is clicked', async () => {
    const wrapper = mountDialog();
    await wrapper.find('.confirm-overlay').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('renders confirm button before cancel button (mobile: confirm on top)', () => {
    const wrapper = mountDialog();
    const buttons = wrapper.findAll('.confirm-actions .btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].classes()).toContain('btn-primary');
    expect(buttons[1].classes()).toContain('btn-outline');
  });

  it('has dialog role and aria-modal attribute', () => {
    const wrapper = mountDialog();
    const dialog = wrapper.find('.confirm-dialog');
    expect(dialog.attributes('role')).toBe('dialog');
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('confirm-actions uses flex layout for button stacking', () => {
    const wrapper = mountDialog();
    const actions = wrapper.find('.confirm-actions');
    expect(actions.exists()).toBe(true);
    // Verify both buttons are inside confirm-actions
    const buttons = actions.findAll('.btn');
    expect(buttons.length).toBe(2);
  });
});
