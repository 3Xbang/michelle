<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">{{ t('auth.loginTitle') }}</h1>
      <form @submit.prevent="handleLogin" novalidate>
        <FormField :label="t('auth.email')" :error="errors.email" required>
          <input
            v-model="form.email"
            type="email"
            class="form-input"
            :placeholder="t('auth.email')"
            @blur="validateEmail"
          />
        </FormField>
        <FormField :label="t('auth.password')" :error="errors.password" required>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            :placeholder="t('auth.password')"
            @blur="validatePassword"
          />
        </FormField>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? t('common.loading') : t('auth.loginButton') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';
import { useToast } from '../composables/useToast.js';
import FormField from '../components/common/FormField.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const form = reactive({ email: '', password: '' });
const errors = reactive({ email: '', password: '' });
const loading = ref(false);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail() {
  if (!form.email.trim()) {
    errors.email = t('validation.required');
  } else if (!emailRegex.test(form.email)) {
    errors.email = t('validation.invalidEmail');
  } else {
    errors.email = '';
  }
}

function validatePassword() {
  errors.password = form.password ? '' : t('validation.required');
}

function validate() {
  validateEmail();
  validatePassword();
  return !errors.email && !errors.password;
}

async function handleLogin() {
  if (!validate()) return;
  loading.value = true;
  try {
    await authStore.login(form.email, form.password);
    router.push('/calendar');
  } catch (err) {
    const msg = err.response?.data?.message || t('auth.loginFailed');
    toast.error(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #111827;
}

.login-btn {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.625rem 1rem;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
