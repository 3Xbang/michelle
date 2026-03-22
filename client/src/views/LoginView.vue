<template>
  <div class="login-page">
    <!-- Access Code Gate -->
    <div v-if="!hasAccess" class="login-card card">
      <div class="login-logo">Mira PMS</div>
      <h1 class="login-title">{{ t('auth.accessTitle') }}</h1>
      <form @submit.prevent="handleAccessCode" novalidate>
        <FormField :label="t('auth.accessCode')" :error="accessError" required>
          <input
            v-model="accessCode"
            type="password"
            class="form-input"
            :placeholder="t('auth.accessCodePlaceholder')"
          />
        </FormField>
        <button type="submit" class="btn btn-primary login-btn">
          {{ t('auth.enter') }}
        </button>
      </form>
    </div>

    <!-- Login Form -->
    <div v-else class="login-card card">
      <div class="login-logo">Mira PMS</div>
      <h1 class="login-title">{{ t('auth.loginTitle') }}</h1>
      <form @submit.prevent="handleLogin" novalidate>
        <FormField :label="t('auth.username')" :error="errors.username" required>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            :placeholder="t('auth.username')"
            @blur="validateUsername"
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

const ACCESS_CODE = 'LLH8702';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const hasAccess = ref(localStorage.getItem('mira_access') === 'granted');
const accessCode = ref('');
const accessError = ref('');

const form = reactive({ username: '', password: '' });
const errors = reactive({ username: '', password: '' });
const loading = ref(false);

function handleAccessCode() {
  if (accessCode.value === ACCESS_CODE) {
    localStorage.setItem('mira_access', 'granted');
    hasAccess.value = true;
    accessError.value = '';
  } else {
    accessError.value = t('auth.wrongAccessCode');
  }
}

function validateUsername() {
  errors.username = form.username.trim() ? '' : t('validation.required');
}

function validatePassword() {
  errors.password = form.password ? '' : t('validation.required');
}

function validate() {
  validateUsername();
  validatePassword();
  return !errors.username && !errors.password;
}

async function handleLogin() {
  if (!validate()) return;
  loading.value = true;
  try {
    await authStore.login(form.username, form.password);
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: var(--spacing-md);
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-logo {
  text-align: center;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.login-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.login-card .form-input {
  min-height: var(--touch-target-nav);
  border-radius: var(--radius-md);
}

.login-btn {
  width: 100%;
  min-height: var(--touch-target-nav);
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
