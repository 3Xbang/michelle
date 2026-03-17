<template>
  <header class="app-header">
    <button class="hamburger" @click="$emit('toggle-sidebar')" aria-label="Toggle menu">☰</button>
    <div class="header-right">
      <select v-model="locale" class="lang-select" @change="switchLang" aria-label="Language">
        <option value="zh-CN">中文</option>
        <option value="en-US">EN</option>
      </select>
      <span class="user-name">{{ authStore.user?.name }}</span>
      <router-link to="/profile" class="header-link">{{ t('nav.profile') }}</router-link>
      <button class="logout-btn" @click="handleLogout">{{ t('nav.logout') }}</button>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

defineEmits(['toggle-sidebar']);

const { t, locale } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

function switchLang() {
  localStorage.setItem('locale', locale.value);
  if (authStore.user) {
    const lang = locale.value === 'zh-CN' ? 'CN' : 'EN';
    authStore.updateUser({ preferred_lang: lang });
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  min-height: 56px;
}
.hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}
.lang-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.user-name {
  color: #374151;
  font-weight: 500;
}
.header-link {
  color: #2563eb;
  text-decoration: none;
}
.header-link:hover {
  text-decoration: underline;
}
.logout-btn {
  padding: 0.375rem 0.75rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}
.logout-btn:hover {
  background: #dc2626;
}

@media (max-width: 1023px) {
  .hamburger {
    display: block;
  }
}
</style>
