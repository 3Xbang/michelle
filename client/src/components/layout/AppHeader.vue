<template>
  <header class="app-header">
    <h1 class="page-title">{{ pageTitle }}</h1>
    <div class="header-right">
      <select v-model="locale" class="lang-select" @change="switchLang" aria-label="Language">
        <option value="zh-CN">中文</option>
        <option value="en-US">EN</option>
      </select>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const { t, locale } = useI18n();
const route = useRoute();
const authStore = useAuthStore();

const routeTitleMap = {
  Calendar: 'calendar.title',
  BookingList: 'booking.title',
  BookingCreate: 'booking.createTitle',
  BookingDetail: 'booking.editTitle',
  TicketList: 'ticket.title',
  TicketCreate: 'ticket.createTitle',
  TicketDetail: 'ticket.detailTitle',
  RoomList: 'room.title',
  RoomEdit: 'room.editTitle',
  Reports: 'report.title',
  Config: 'config.title',
  UserList: 'user.title',
  Profile: 'profile.title',
  MoreMenu: 'nav.more',
};

const pageTitle = computed(() => {
  const key = routeTitleMap[route.name];
  return key ? t(key) : '';
});

function switchLang() {
  localStorage.setItem('locale', locale.value);
  if (authStore.user) {
    const lang = locale.value === 'zh-CN' ? 'CN' : 'EN';
    authStore.updateUser({ preferred_lang: lang });
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: 56px;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}

.lang-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-base);
  min-height: var(--touch-target-min);
}
</style>
