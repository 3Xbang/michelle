<template>
  <div>
    <h1 class="page-title">{{ t('profile.title') }}</h1>

    <!-- User Info Display + Edit Form -->
    <div class="card profile-section">
      <h2 class="section-title">{{ t('profile.updateInfo') }}</h2>
      <form @submit.prevent="handleUpdateInfo" novalidate>
        <FormField :label="t('user.email')">
          <input :value="authStore.user?.email" class="form-input" disabled />
        </FormField>
        <FormField :label="t('user.role')">
          <input :value="t('enum.userRole.' + (authStore.user?.role || 'Staff'))" class="form-input" disabled />
        </FormField>
        <FormField :label="t('user.userName')" :error="infoErrors.name" required>
          <input v-model="infoForm.name" class="form-input" @blur="validateName" />
        </FormField>
        <FormField :label="t('user.phone')">
          <input v-model="infoForm.phone" class="form-input" />
        </FormField>
        <FormField :label="t('user.preferredLang')">
          <select v-model="infoForm.preferred_lang" class="form-select">
            <option value="CN">{{ t('enum.lang.CN') }}</option>
            <option value="EN">{{ t('enum.lang.EN') }}</option>
          </select>
        </FormField>
        <button type="submit" class="btn btn-primary" :disabled="infoLoading">
          {{ infoLoading ? t('common.loading') : t('common.save') }}
        </button>
      </form>
    </div>

    <!-- Password Change Form -->
    <div class="card profile-section">
      <h2 class="section-title">{{ t('profile.changePassword') }}</h2>
      <form @submit.prevent="handleChangePassword" novalidate>
        <FormField :label="t('user.oldPassword')" :error="pwErrors.oldPassword" required>
          <input v-model="pwForm.oldPassword" type="password" class="form-input" />
        </FormField>
        <FormField :label="t('user.newPassword')" :error="pwErrors.newPassword" required>
          <input v-model="pwForm.newPassword" type="password" class="form-input" />
        </FormField>
        <FormField :label="t('user.confirmPassword')" :error="pwErrors.confirmPassword" required>
          <input v-model="pwForm.confirmPassword" type="password" class="form-input" />
        </FormField>
        <button type="submit" class="btn btn-primary" :disabled="pwLoading">
          {{ pwLoading ? t('common.loading') : t('profile.changePassword') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';
import apiClient from '../api/client.js';
import { useToast } from '../composables/useToast.js';
import FormField from '../components/common/FormField.vue';

const { t, locale } = useI18n();
const authStore = useAuthStore();
const toast = useToast();

// --- Info form ---
const infoForm = reactive({
  name: '',
  phone: '',
  preferred_lang: 'CN',
});
const infoErrors = reactive({ name: '' });
const infoLoading = ref(false);

onMounted(() => {
  const u = authStore.user;
  if (u) {
    infoForm.name = u.name || '';
    infoForm.phone = u.phone || '';
    infoForm.preferred_lang = u.preferred_lang || 'CN';
  }
});

function validateName() {
  infoErrors.name = infoForm.name.trim() ? '' : t('validation.required');
}

function validateInfo() {
  validateName();
  return !infoErrors.name;
}

async function handleUpdateInfo() {
  if (!validateInfo()) return;
  infoLoading.value = true;
  try {
    const { data } = await apiClient.put('/users/me', {
      name: infoForm.name.trim(),
      phone: infoForm.phone.trim(),
      preferred_lang: infoForm.preferred_lang,
    });
    authStore.updateUser(data.user || data);
    // Sync locale
    locale.value = infoForm.preferred_lang === 'CN' ? 'zh-CN' : 'en-US';
    toast.success(t('profile.infoUpdated'));
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    infoLoading.value = false;
  }
}

// --- Password form ---
const pwForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const pwErrors = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const pwLoading = ref(false);

function validatePwFields() {
  pwErrors.oldPassword = pwForm.oldPassword ? '' : t('validation.required');
  pwErrors.newPassword = pwForm.newPassword ? '' : t('validation.required');
  if (pwForm.newPassword && pwForm.newPassword.length < 6) {
    pwErrors.newPassword = t('validation.minLength', { min: 6 });
  }
  if (!pwForm.confirmPassword) {
    pwErrors.confirmPassword = t('validation.required');
  } else if (pwForm.confirmPassword !== pwForm.newPassword) {
    pwErrors.confirmPassword = t('validation.passwordMismatch');
  } else {
    pwErrors.confirmPassword = '';
  }
  return !pwErrors.oldPassword && !pwErrors.newPassword && !pwErrors.confirmPassword;
}

async function handleChangePassword() {
  if (!validatePwFields()) return;
  pwLoading.value = true;
  try {
    await apiClient.put('/users/me/password', {
      old_password: pwForm.oldPassword,
      new_password: pwForm.newPassword,
    });
    toast.success(t('profile.passwordChanged'));
    pwForm.oldPassword = '';
    pwForm.newPassword = '';
    pwForm.confirmPassword = '';
  } catch (err) {
    const msg = err.response?.data?.message || t('profile.oldPasswordWrong');
    toast.error(msg);
  } finally {
    pwLoading.value = false;
  }
}
</script>

<style scoped>
.profile-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
}
</style>
