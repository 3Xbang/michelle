<template>
  <div class="app-layout" :class="{ 'sidebar-open': sidebarOpen }">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="app-main">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';

const sidebarOpen = ref(false);
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
</style>
