<template>
  <aside class="sidebar" :class="{ open }">
    <div class="sidebar-header">
      <h2 class="sidebar-logo">Villa PMS</h2>
      <button class="sidebar-close" @click="$emit('close')" aria-label="Close menu">&times;</button>
    </div>
    <nav class="sidebar-nav">
      <router-link v-for="item in visibleItems" :key="item.to" :to="item.to" class="nav-item" @click="$emit('close')">
        {{ t(item.label) }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth.js';

defineProps({ open: Boolean });
defineEmits(['close']);

const { t } = useI18n();
const authStore = useAuthStore();

const allItems = [
  { to: '/calendar', label: 'nav.calendar' },
  { to: '/bookings', label: 'nav.bookings' },
  { to: '/tickets', label: 'nav.tickets' },
  { to: '/rooms', label: 'nav.rooms', admin: true },
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
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: transform 0.3s;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.sidebar-logo {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}
.sidebar-close {
  display: none;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
}
.nav-item {
  display: block;
  padding: 0.75rem 1.25rem;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.nav-item:hover,
.nav-item.router-link-active {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .sidebar-close {
    display: block;
  }
}
</style>
