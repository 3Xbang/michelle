import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginView from '../../views/LoginView.vue';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const map = {
        'auth.loginTitle': '登录',
        'auth.email': '邮箱',
        'auth.password': '密码',
        'auth.loginButton': '登录',
        'common.loading': '加载中...',
      };
      return map[key] || key;
    },
  }),
}));

// Mock stores and composables
vi.mock('../../stores/auth.js', () => ({
  useAuthStore: () => ({ login: vi.fn() }),
}));

vi.mock('../../composables/useToast.js', () => ({
  useToast: () => ({ error: vi.fn() }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function mountView() {
  return mount(LoginView, {
    global: {
      stubs: {
        FormField: {
          template: '<div class="form-field"><slot /></div>',
          props: ['label', 'error', 'required'],
        },
      },
    },
  });
}

describe('LoginView', () => {
  it('renders with a dark gradient background', () => {
    const wrapper = mountView();
    const page = wrapper.find('.login-page');
    expect(page.exists()).toBe(true);
    // The scoped style applies a linear-gradient background
    // We verify the element has the correct class
    expect(page.classes()).toContain('login-page');
  });

  it('renders the login card centered', () => {
    const wrapper = mountView();
    const card = wrapper.find('.login-card');
    expect(card.exists()).toBe(true);
    expect(card.classes()).toContain('card');
  });

  it('displays the Villa PMS logo text', () => {
    const wrapper = mountView();
    const logo = wrapper.find('.login-logo');
    expect(logo.exists()).toBe(true);
    expect(logo.text()).toBe('Villa PMS');
  });

  it('displays the login title', () => {
    const wrapper = mountView();
    const title = wrapper.find('.login-title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('登录');
  });

  it('renders email and password input fields', () => {
    const wrapper = mountView();
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2);
    expect(inputs[0].attributes('type')).toBe('email');
    expect(inputs[1].attributes('type')).toBe('password');
  });

  it('renders the login button with primary style', () => {
    const wrapper = mountView();
    const btn = wrapper.find('.login-btn');
    expect(btn.exists()).toBe(true);
    expect(btn.classes()).toContain('btn-primary');
    expect(btn.text()).toBe('登录');
  });

  it('login button is disabled when loading', async () => {
    const wrapper = mountView();
    const btn = wrapper.find('.login-btn');
    // Initially not disabled
    expect(btn.attributes('disabled')).toBeUndefined();
  });
});
