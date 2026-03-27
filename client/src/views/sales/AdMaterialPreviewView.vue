<template>
  <div>
    <div class="page-header">
      <button class="btn btn-outline btn-sm" @click="router.back()">← {{ t('common.back') }}</button>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="copyText">
          {{ copied ? t('sales.adMaterials.copied') : t('sales.adMaterials.copyText') }}
        </button>
        <button class="btn btn-primary btn-sm" @click="downloadZip" :disabled="downloading">
          {{ downloading ? t('common.loading') : t('sales.adMaterials.downloadZip') }}
        </button>
      </div>
    </div>

    <div v-if="!material" class="loading-text">{{ t('common.loading') }}</div>
    <template v-else>
      <div class="fb-post">
        <div class="fb-header">
          <div class="fb-avatar">🏠</div>
          <div class="fb-meta">
            <div class="fb-page-name">{{ t('sales.inquiry.title') }}</div>
            <div class="fb-time">🌐</div>
          </div>
        </div>
        <div class="fb-text">{{ material.description }}</div>
        <div v-if="material.tags?.length" class="fb-tags">
          <span v-for="tag in material.tags" :key="tag" class="fb-tag">#{{ tag }}</span>
        </div>
        <div v-if="photos.length" class="fb-photos">
          <div class="fb-carousel">
            <img :src="photos[activePhoto]?.url" class="fb-carousel-img" />
            <div v-if="photos.length > 1" class="fb-carousel-nav">
              <button class="nav-btn" @click="prevPhoto" :disabled="activePhoto === 0">‹</button>
              <span class="photo-counter">{{ activePhoto + 1 }} / {{ photos.length }}</span>
              <button class="nav-btn" @click="nextPhoto" :disabled="activePhoto === photos.length - 1">›</button>
            </div>
          </div>
          <div v-if="photos.length > 1" class="fb-thumbnails">
            <img v-for="(ph, i) in photos" :key="ph.id" :src="ph.url" class="fb-thumb" :class="{ active: i === activePhoto }" @click="activePhoto = i" />
          </div>
        </div>
        <div v-else class="fb-no-photos">{{ t('sales.adMaterials.noPhotos') }}</div>
        <div class="fb-actions">
          <span class="fb-action">👍</span>
          <span class="fb-action">💬</span>
          <span class="fb-action">↗</span>
        </div>
      </div>
      <div v-if="downloadError" class="error-msg">{{ downloadError }}</div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdMaterialStore } from '../../stores/adMaterial.js';
import { useToast } from '../../composables/useToast.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAdMaterialStore();
const toast = useToast();

const material = ref(null);
const activePhoto = ref(0);
const copied = ref(false);
const downloading = ref(false);
const downloadError = ref('');

const photos = computed(() => material.value?.photos || []);

function prevPhoto() { if (activePhoto.value > 0) activePhoto.value--; }
function nextPhoto() { if (activePhoto.value < photos.value.length - 1) activePhoto.value++; }

async function copyText() {
  if (!material.value?.description) return;
  try {
    await navigator.clipboard.writeText(material.value.description);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch { toast.error(t('error.unknown')); }
}

async function downloadZip() {
  if (!photos.value.length) {
    downloadError.value = t('sales.adMaterials.noPhotos');
    return;
  }
  downloadError.value = '';
  downloading.value = true;
  try {
    await store.downloadZip(route.params.id, `${material.value.title || 'ad-material'}.zip`);
    toast.success(t('sales.adMaterials.downloadZip'));
  } catch (err) {
    downloadError.value = err.response?.data?.message || t('error.unknown');
  } finally {
    downloading.value = false;
  }
}

onMounted(async () => {
  material.value = await store.fetchMaterial(route.params.id);
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.header-actions { display: flex; gap: 0.625rem; }
.loading-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

/* Facebook post simulation */
.fb-post {
  max-width: 500px; margin: 0 auto;
  background: #fff; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08);
  overflow: hidden;
}

.fb-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem 0.5rem; }
.fb-avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 50%;
  background: #1877f2; display: flex; align-items: center; justify-content: center;
  font-size: 1.25rem;
}
.fb-page-name { font-weight: 700; font-size: 0.9375rem; color: #050505; }
.fb-time { font-size: 0.75rem; color: #65676b; }

.fb-text {
  padding: 0.5rem 1rem 0.75rem;
  font-size: 0.9375rem; color: #050505; line-height: 1.6;
  white-space: pre-wrap;
}

.fb-tags { padding: 0 1rem 0.75rem; display: flex; flex-wrap: wrap; gap: 0.375rem; }
.fb-tag { color: #1877f2; font-size: 0.875rem; font-weight: 600; }

.fb-photos { border-top: 1px solid #e4e6eb; }
.fb-carousel { position: relative; background: #000; }
.fb-carousel-img { width: 100%; max-height: 360px; object-fit: contain; display: block; }
.fb-carousel-nav {
  position: absolute; bottom: 0.5rem; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0.5rem;
  background: rgba(0,0,0,0.5); border-radius: 999px; padding: 0.25rem 0.75rem;
}
.nav-btn {
  background: none; border: none; color: #fff; font-size: 1.25rem; cursor: pointer;
  padding: 0 0.25rem; line-height: 1;
}
.nav-btn:disabled { opacity: 0.3; cursor: default; }
.photo-counter { color: #fff; font-size: 0.8125rem; }

.fb-thumbnails { display: flex; gap: 2px; padding: 2px; background: #e4e6eb; }
.fb-thumb { width: 60px; height: 60px; object-fit: cover; cursor: pointer; opacity: 0.7; transition: opacity 0.15s; }
.fb-thumb.active { opacity: 1; outline: 2px solid #1877f2; }

.fb-no-photos { padding: 1.5rem; text-align: center; color: #65676b; font-size: 0.875rem; }

.fb-actions {
  display: flex; border-top: 1px solid #e4e6eb;
  padding: 0.25rem 0.5rem;
}
.fb-action {
  flex: 1; text-align: center; padding: 0.5rem;
  font-size: 0.875rem; font-weight: 600; color: #65676b;
  cursor: pointer; border-radius: 6px;
}
.fb-action:hover { background: #f0f2f5; }

.error-msg {
  max-width: 500px; margin: 1rem auto 0;
  background: #fee2e2; color: #991b1b; border-radius: 8px;
  padding: 0.625rem 0.875rem; font-size: 0.875rem;
}
</style>
