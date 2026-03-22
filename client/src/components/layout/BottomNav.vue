<template>
  <nav class="bottom-nav" role="navigation" aria-label="主导航">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': activeRoute === item.to }"
      :aria-current="activeRoute === item.to ? 'page' : undefined"
    >
      <span class="bottom-nav__icon">
        <SvgIcon :name="item.icon" :size="24" />
        <span v-if="item.badge" class="bottom-nav__badge">{{ item.badge }}</span>
      </span>
      <span class="bottom-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import SvgIcon from '../icons/SvgIcon.vue'

defineProps({
  items: {
    type: Array,
    required: true,
    // Each item: { to: String, icon: String, label: String, badge?: Number|String }
  },
  activeRoute: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--bottom-nav-height, 56px);
  background-color: var(--color-nav-bg);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 48px;
  padding: 4px 0;
  color: var(--color-nav-text);
  text-decoration: none;
  transition: color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__item--active,
.bottom-nav__item.router-link-active {
  color: var(--color-nav-active);
}

.bottom-nav__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.bottom-nav__badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-danger);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
}

.bottom-nav__label {
  margin-top: 2px;
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
}

/* Hide on desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}
</style>
