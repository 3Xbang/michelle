<template>
  <div class="app-layout">
    <AppSidebar v-if="isDesktop" />
    <div class="app-main">
      <AppHeader />
      <main class="app-content" :class="{ 'app-content--mobile': !isDesktop }">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
    <BottomNav
      v-if="!isDesktop"
      :items="navItems"
      :activeRoute="currentRoute"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import { useAuthStore } from '../../stores/auth.js';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import BottomNav from './BottomNav.vue';

const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();
const isDesktop = useMediaQuery('(min-width: 1024px)');

const currentRoute = computed(() => route.path);

const navItems = computed(() => {
  const items = [
    { to: '/calendar', icon: 'calendar', label: t('nav.calendar') },
    { to: '/bookings', icon: 'booking', label: t('nav.bookings') },
    { to: '/tickets', icon: 'ticket', label: t('nav.tickets') },
    { to: '/profile', icon: 'person', label: t('nav.profile') },
  ];
  if (authStore.isAdmin) {
    items.push({ to: '/more', icon: 'more', label: t('nav.more') });
  }
  return items;
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}
.app-content--mobile {
  padding-bottom: calc(var(--bottom-nav-height, 56px) + 1.5rem);
}

/* Page transition */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 200ms ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
