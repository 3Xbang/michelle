<template>
  <div class="not-found">
    <h1 class="not-found-title">{{ t('notFound.title') }}</h1>
    <p class="not-found-message">{{ t('notFound.message') }}</p>
    <router-link to="/" class="btn btn-primary">{{ t('notFound.backHome') }}</router-link>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.not-found-title {
  font-size: 4rem;
  font-weight: 700;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.not-found-message {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}
</style>
