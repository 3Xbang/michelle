<template>
  <div class="more-menu">
    <h1 class="page-title">{{ t('nav.more') }}</h1>
    <div class="menu-grid">
      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="menu-item"
      >
        <SvgIcon :name="item.icon" :size="32" />
        <span class="menu-label">{{ t(item.labelKey) }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import SvgIcon from '../components/icons/SvgIcon.vue';

const { t } = useI18n();

const menuItems = [
  { to: '/rooms', icon: 'room', labelKey: 'nav.rooms' },
  { to: '/channel', icon: 'channel', labelKey: 'nav.channel' },
  { to: '/owners', icon: 'users', labelKey: 'nav.owners' },
  { to: '/reports', icon: 'report', labelKey: 'nav.reports' },
  { to: '/config', icon: 'config', labelKey: 'nav.config' },
  { to: '/users', icon: 'users', labelKey: 'nav.users' },
];
</script>

<style scoped>
.more-menu {
  padding: var(--spacing-md);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-md);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
  min-height: var(--touch-target-min);
}

.menu-item:active {
  transform: scale(0.97);
  box-shadow: var(--shadow-md);
}

.menu-label {
  font-size: var(--font-size-base);
  font-weight: 500;
}
</style>
