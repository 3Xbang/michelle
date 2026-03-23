<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-logo">Villa PMS</h2>
    </div>
    <nav class="sidebar-nav">
      <router-link v-for="item in visibleItems" :key="item.to" :to="item.to" class="nav-item">
        {{ t(item.label) }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth.js';

const { t } = useI18n();
const authStore = useAuthStore();

const allItems = [
  { to: '/calendar', label: 'nav.calendar' },
  { to: '/bookings', label: 'nav.bookings' },
  { to: '/tickets', label: 'nav.tickets' },
  { to: '/rooms', label: 'nav.rooms', admin: true },
  { to: '/channel', label: 'nav.channel', admin: true },
  { to: '/reports', label: 'nav.reports', admin: true },
  { to: '/config', label: 'nav.config', admin: true },
  { to: '/users', label: 'nav.users', admin: true },
];

const visibleItems = computed(() =>
  allItems.filter((item) => !item.admin || authStore.isAdmin)
);
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--color-nav-bg);
  color: var(--color-nav-active);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.sidebar-logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 0;
}
.nav-item {
  display: block;
  padding: 0.75rem 1.25rem;
  color: var(--color-nav-text);
  text-decoration: none;
  transition: background var(--transition-normal), color var(--transition-normal);
}
.nav-item:hover,
.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-nav-active);
}

/* Fallback: hide on mobile (AppLayout already uses v-if="isDesktop") */
@media (max-width: 1023px) {
  .sidebar {
    display: none;
  }
}
</style>
