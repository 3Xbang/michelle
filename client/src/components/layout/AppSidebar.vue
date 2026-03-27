<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-logo">Villa PMS</h2>
    </div>
    <nav class="sidebar-nav">
      <template v-for="item in visibleItems" :key="item.to">
        <div v-if="item.sectionHeader" class="nav-section-header">{{ item.sectionHeader }}</div>
        <router-link v-else :to="item.to" class="nav-item">
          {{ t(item.label) }}
        </router-link>
      </template>
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
  { to: '/owners', label: 'nav.owners', admin: true },
  { to: '/reports', label: 'nav.reports', admin: true },
  { to: '/config', label: 'nav.config', admin: true },
  { to: '/users', label: 'nav.users', admin: true },
  // Sales CRM
  { to: '/sales/properties', label: 'nav.salesProperties' },
  { to: '/sales/customers', label: 'nav.salesCustomers' },
  { to: '/sales/intents', label: 'nav.salesIntents' },
  { to: '/sales/reminders', label: 'nav.salesReminders' },
  { to: '/sales/reports', label: 'nav.salesReports' },
  // Miraa CMS
  { to: '/miraa/properties', label: 'nav.miraaProperties', admin: true, section: 'miraa' },
  { to: '/miraa/banners', label: 'nav.miraaBanners', admin: true, section: 'miraa' },
  { to: '/miraa/settings', label: 'nav.miraaSettings', admin: true, section: 'miraa' },
];

const visibleItems = computed(() => {
  const items = [];
  let lastSection = null;
  for (const item of allItems) {
    if (!item.admin || authStore.isAdmin) {
      if (item.section && item.section !== lastSection) {
        lastSection = item.section;
        const headers = { miraa: '── Miraa 网站 ──' };
        items.push({ sectionHeader: headers[item.section] });
      }
      items.push(item);
    }
  }
  return items;
});
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

.nav-section-header {
  padding: 0.75rem 1.25rem 0.25rem;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Fallback: hide on mobile (AppLayout already uses v-if="isDesktop") */
@media (max-width: 1023px) {
  .sidebar {
    display: none;
  }
}
</style>
