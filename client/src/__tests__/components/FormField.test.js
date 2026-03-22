import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FormField from '../../components/common/FormField.vue';

function mountField(props = {}, slotContent = '') {
  return mount(FormField, {
    props,
    slots: {
      default: slotContent || '<input class="form-input" />',
    },
  });
}

describe('FormField', () => {
  it('renders label when provided', () => {
    const wrapper = mountField({ label: 'Email' });
    expect(wrapper.find('.form-field__label').text()).toContain('Email');
  });

  it('hides label when not provided', () => {
    const wrapper = mountField({});
    expect(wrapper.find('.form-field__label').exists()).toBe(false);
  });

  it('shows required asterisk when required is true', () => {
    const wrapper = mountField({ label: 'Name', required: true });
    expect(wrapper.find('.form-field__required').exists()).toBe(true);
    expect(wrapper.find('.form-field__required').text()).toBe('*');
  });

  it('hides required asterisk when required is false', () => {
    const wrapper = mountField({ label: 'Name', required: false });
    expect(wrapper.find('.form-field__required').exists()).toBe(false);
  });

  it('renders error message when error prop is provided', () => {
    const wrapper = mountField({ error: 'This field is required' });
    const errorEl = wrapper.find('.form-field__error');
    expect(errorEl.exists()).toBe(true);
    expect(errorEl.text()).toBe('This field is required');
  });

  it('hides error message when error prop is empty', () => {
    const wrapper = mountField({ error: '' });
    expect(wrapper.find('.form-field__error').exists()).toBe(false);
  });

  it('renders slot content inside form-field__control', () => {
    const wrapper = mountField({}, '<select class="form-select"><option>A</option></select>');
    const control = wrapper.find('.form-field__control');
    expect(control.exists()).toBe(true);
    expect(control.find('select').exists()).toBe(true);
  });

  it('has form-field root class', () => {
    const wrapper = mountField({ label: 'Test' });
    expect(wrapper.find('.form-field').exists()).toBe(true);
  });
});
