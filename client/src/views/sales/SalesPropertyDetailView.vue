<template>
  <div>
    <div class="page-header">
      <button class="btn btn-outline btn-sm" @click="router.back()">← {{ t('common.back') }}</button>
      <button class="btn btn-primary btn-sm" @click="router.push(`/sales/properties/${route.params.id}/edit`)">{{ t('common.edit') }}</button>
    </div>

    <div v-if="store.loading" class="loading-text">{{ t('common.loading') }}</div>
    <template v-else-if="p">
      <div class="photo-carousel" v-if="p.photos?.length">
        <img :src="p.photos[activePhoto]?.url" class="carousel-img" />
        <div class="carousel-dots">
          <span v-for="(ph, i) in p.photos" :key="ph.id" class="dot" :class="{ active: i === activePhoto }" @click="activePhoto = i"></span>
        </div>
      </div>
      <div v-else class="photo-placeholder">🏠 {{ t('sales.adMaterials.noPhotos') }}</div>

      <div class="card info-card">
        <div class="info-header">
          <h2 class="info-name">{{ p.name }}</h2>
          <span class="status-badge" :class="'status-' + p.status">{{ t('sales.properties.status.' + p.status) }}</span>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.unitType') }}</span><span>{{ p.unit_type }}</span></div>
          <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.area') }}</span><span>{{ p.area_sqm }}㎡</span></div>
          <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.price') }}</span><span class="price">¥{{ formatNum(p.price) }}</span></div>
          <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.propertyType') }}</span><span class="type-badge" :class="'type-' + p.property_type">{{ t('sales.properties.type.' + p.property_type) }}</span></div>
          <div v-if="p.floor" class="info-item"><span class="info-label">{{ t('sales.properties.fields.floor') }}</span><span>{{ p.floor }}</span></div>
          <div v-if="p.orientation" class="info-item"><span class="info-label">{{ t('sales.properties.fields.orientation') }}</span><span>{{ p.orientation }}</span></div>
        </div>
        <template v-if="p.property_type === 'external'">
          <div class="owner-info">
            <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.ownerName') }}</span><span>{{ p.owner_name }}</span></div>
            <div class="info-item"><span class="info-label">{{ t('sales.properties.fields.ownerContact') }}</span><span>{{ p.owner_contact }}</span></div>
          </div>
        </template>
        <div v-if="p.notes" class="info-notes">{{ p.notes }}</div>
      </div>

      <div class="tabs">
        <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'viewings'">
        <div class="tab-header">
          <span class="tab-count">{{ viewings.length }}</span>
          <button class="btn btn-primary btn-sm" @click="router.push({ path: '/sales/viewing-records/new', query: { property_id: p.id } })">+ {{ t('sales.viewingRecords.create') }}</button>
        </div>
        <div v-if="viewings.length === 0" class="empty-text">{{ t('sales.viewingRecords.noData') }}</div>
        <div v-else class="record-list">
          <div v-for="v in viewings" :key="v.id" class="record-item">
            <div class="record-main">
              <span class="record-name">{{ v.customer_name }}</span>
              <span class="record-time">{{ formatDate(v.viewed_at) }}</span>
            </div>
            <div v-if="v.notes" class="record-notes">{{ v.notes }}</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'intents'">
        <div class="tab-header">
          <span class="tab-count">{{ intents.length }}</span>
          <button class="btn btn-primary btn-sm" @click="router.push({ path: '/sales/intents/new', query: { property_id: p.id } })">+ {{ t('sales.intents.create') }}</button>
        </div>
        <div v-if="intents.length === 0" class="empty-text">{{ t('sales.intents.noData') }}</div>
        <div v-else class="record-list">
          <div v-for="intent in intents" :key="intent.id" class="record-item" @click="router.push(`/sales/intents/${intent.id}`)">
            <div class="record-main">
              <span class="record-name">{{ intent.customer_name }}</span>
              <span class="level-badge" :class="'level-' + intent.intent_level">{{ t('sales.intents.level.' + intent.intent_level) }}</span>
            </div>
            <div class="record-time">{{ t('sales.intents.lastFollowUp') }}：{{ formatDate(intent.last_follow_up_at) }}</div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'ads'">
        <div class="tab-header">
          <span class="tab-count">{{ adMaterials.length }}</span>
          <button class="btn btn-primary btn-sm" @click="router.push({ path: '/sales/ad-materials/new', query: { property_id: p.id } })">+ {{ t('sales.adMaterials.create') }}</button>
        </div>
        <div v-if="adMaterials.length === 0" class="empty-text">{{ t('sales.adMaterials.noData') }}</div>
        <div v-else class="record-list">
          <div v-for="ad in adMaterials" :key="ad.id" class="record-item" @click="router.push(`/sales/ad-materials/${ad.id}/preview`)">
            <div class="record-main">
              <span class="record-name">{{ ad.title }}</span>
              <span class="status-badge" :class="'ad-' + ad.ad_status">{{ t('sales.adMaterials.status.' + ad.ad_status) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesPropertyStore } from '../../stores/salesProperty.js';
import { useAdMaterialStore } from '../../stores/adMaterial.js';
import { viewingRecordsApi, intentsApi } from '../../api/sales.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useSalesPropertyStore();
const adStore = useAdMaterialStore();

const p = ref(null);
const activePhoto = ref(0);
const activeTab = ref('viewings');
const viewings = ref([]);
const intents = ref([]);
const adMaterials = ref([]);

const tabs = [
  { key: 'viewings', label: t('sales.properties.tabs.viewings') },
  { key: 'intents', label: t('sales.properties.tabs.intents') },
  { key: 'ads', label: t('sales.properties.tabs.ads') },
];

function formatNum(v) {
  if (!v) return '0';
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function switchTab(key) {
  activeTab.value = key;
  const id = route.params.id;
  if (key === 'viewings' && viewings.value.length === 0) {
    const { data } = await viewingRecordsApi.list({ property_id: id });
    viewings.value = data.sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));
  }
  if (key === 'intents' && intents.value.length === 0) {
    const { data } = await intentsApi.list({ property_id: id });
    intents.value = data.sort((a, b) => {
      const order = { signed: 4, hot: 3, warm: 2, cold: 1 };
      return (order[b.intent_level] || 0) - (order[a.intent_level] || 0);
    });
  }
  if (key === 'ads' && adMaterials.value.length === 0) {
    await adStore.fetchMaterials({ property_id: id });
    adMaterials.value = adStore.materials;
  }
}

onMounted(async () => {
  p.value = await store.fetchProperty(route.params.id);
  await switchTab('viewings');
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }

.photo-carousel { position: relative; margin-bottom: 1rem; border-radius: 14px; overflow: hidden; height: 220px; background: #f3f4f6; }
.carousel-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.carousel-dots { position: absolute; bottom: 0.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.375rem; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.5); cursor: pointer; }
.dot.active { background: #fff; }
.photo-placeholder { height: 120px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #9ca3af; background: #f9fafb; border-radius: 14px; margin-bottom: 1rem; }

.info-card { padding: 1.25rem; margin-bottom: 1rem; }
.info-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
.info-name { font-size: 1.25rem; font-weight: 800; color: var(--color-text-primary, #111827); margin: 0; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.info-label { font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); }
.price { font-weight: 800; color: #2563eb; font-size: 1rem; }
.owner-info { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border, #e5e7eb); display: flex; gap: 1.5rem; flex-wrap: wrap; }
.info-notes { margin-top: 0.75rem; font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }

.status-badge, .type-badge, .level-badge {
  font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px;
}
.status-available { background: #dcfce7; color: #166534; }
.status-reserved { background: #fef9c3; color: #854d0e; }
.status-sold { background: #fee2e2; color: #991b1b; }
.type-own { background: #dbeafe; color: #1d4ed8; }
.type-external { background: #f3e8ff; color: #6b21a8; }
.level-cold { background: #dbeafe; color: #1d4ed8; }
.level-warm { background: #fef9c3; color: #854d0e; }
.level-hot { background: #fee2e2; color: #991b1b; }
.level-signed { background: #dcfce7; color: #166534; }
.ad-draft { background: #f3f4f6; color: #6b7280; }
.ad-published { background: #dcfce7; color: #166534; }
.ad-paused { background: #fef9c3; color: #854d0e; }

.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border, #e5e7eb); margin-bottom: 1rem; }
.tab-btn {
  padding: 0.625rem 1.25rem; font-size: 0.9375rem; font-weight: 600;
  background: none; border: none; cursor: pointer; color: var(--color-text-secondary, #6b7280);
  border-bottom: 2px solid transparent; margin-bottom: -2px;
}
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

.tab-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.tab-count { font-size: 0.875rem; color: var(--color-text-secondary, #6b7280); }

.record-list { display: flex; flex-direction: column; gap: 0.625rem; }
.record-item {
  background: var(--color-surface, #fff); border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 10px; padding: 0.875rem; cursor: pointer;
  transition: box-shadow 0.15s;
}
.record-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.record-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
.record-name { font-weight: 600; color: var(--color-text-primary, #111827); }
.record-time { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.record-notes { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
</style>
