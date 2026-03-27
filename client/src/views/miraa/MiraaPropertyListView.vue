<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Miraa 房源管理</h1>
      <router-link to="/miraa/properties/new" class="btn btn-primary">+ 新增房源</router-link>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="empty">加载中...</div>
      <div v-else-if="filtered.length === 0" class="empty">暂无房源</div>
      <div v-else class="property-grid">
        <div v-for="p in filtered" :key="p.id" class="property-card">
          <div class="property-img">
            <img v-if="p.photos?.[0]" :src="p.photos[0].url" :alt="p.title" />
            <div v-else class="no-img">无图片</div>
            <span class="badge" :class="p.is_published ? 'badge-on' : 'badge-off'">
              {{ p.is_published ? '已发布' : '草稿' }}
            </span>
          </div>
          <div class="property-info">
            <p class="property-title">{{ p.title }}</p>
            <p class="property-meta">{{ typeLabel(p.property_type) }} · {{ p.location || '—' }}</p>
            <p class="property-price">{{ p.currency }} {{ Number(p.price).toLocaleString() }}</p>
          </div>
          <div class="property-actions">
            <router-link :to="`/miraa/properties/${p.id}/edit`" class="btn btn-outline btn-sm">编辑</router-link>
            <button class="btn btn-danger btn-sm" @click="remove(p.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getProperties, deleteProperty } from '../../api/miraa.js';
import { useToast } from '../../composables/useToast.js';

const toast = useToast();
const loading = ref(true);
const properties = ref([]);
const activeTab = ref('all');

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'new', label: '新房' },
  { key: 'resale', label: '二手房' },
  { key: 'rental', label: '出租' },
];

const typeLabel = (t) => ({ new: '新房', resale: '二手房', rental: '出租' }[t] || t);

const filtered = computed(() =>
  activeTab.value === 'all' ? properties.value : properties.value.filter(p => p.property_type === activeTab.value)
);

onMounted(async () => {
  try {
    const res = await getProperties();
    properties.value = res.data;
  } catch { toast.error('加载失败'); }
  finally { loading.value = false; }
});

async function remove(id) {
  if (!confirm('确认删除？')) return;
  try {
    await deleteProperty(id);
    properties.value = properties.value.filter(p => p.id !== id);
    toast.success('已删除');
  } catch { toast.error('删除失败'); }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.tab-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.tab-btn { padding: 0.4rem 1rem; border-radius: 999px; border: 1px solid var(--color-border); background: white; cursor: pointer; font-size: 0.875rem; }
.tab-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.empty { text-align: center; padding: 2rem; color: var(--color-text-muted); }
.property-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; padding: 1rem; }
.property-card { border: 1px solid var(--color-border); border-radius: 0.75rem; overflow: hidden; }
.property-img { position: relative; aspect-ratio: 16/9; background: #f3f4f6; }
.property-img img { width: 100%; height: 100%; object-fit: cover; }
.no-img { display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 0.875rem; }
.badge { position: absolute; top: 6px; right: 6px; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }
.badge-on { background: #dcfce7; color: #15803d; }
.badge-off { background: #f3f4f6; color: #6b7280; }
.property-info { padding: 0.75rem; }
.property-title { font-weight: 600; margin-bottom: 0.25rem; }
.property-meta { font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
.property-price { font-weight: 700; color: var(--color-primary); }
.property-actions { display: flex; gap: 0.5rem; padding: 0.5rem 0.75rem; border-top: 1px solid var(--color-border); }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
.btn-danger { background: #ef4444; color: white; border: none; border-radius: 0.375rem; cursor: pointer; }
</style>
