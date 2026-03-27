<template>
  <div>
    <h1 class="page-title">Miraa 轮播图管理</h1>
    <p class="desc">管理 miraa.homes 首页轮播图，最多 8 张。拖拽可调整顺序。</p>

    <div class="card">
      <div class="banner-grid">
        <div v-for="(b, i) in banners" :key="b.id" class="banner-item">
          <img :src="b.url" :alt="`Banner ${i+1}`" />
          <span class="banner-num">{{ i + 1 }}</span>
          <button class="btn-remove" @click="remove(b.id)">✕</button>
        </div>
        <label v-if="banners.length < 8" class="upload-slot">
          <input type="file" accept="image/*" @change="upload" :disabled="uploading" />
          <span>{{ uploading ? '上传中...' : '+ 上传图片' }}</span>
        </label>
      </div>
      <p v-if="banners.length === 0" class="empty">暂无轮播图</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getBanners, uploadBanner, deleteBanner } from '../../api/miraa.js';
import { useToast } from '../../composables/useToast.js';

const toast = useToast();
const banners = ref([]);
const uploading = ref(false);

onMounted(async () => {
  try { const res = await getBanners(); banners.value = res.data; }
  catch { toast.error('加载失败'); }
});

async function upload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const res = await uploadBanner(file);
    banners.value.push(res.data);
    toast.success('上传成功');
  } catch { toast.error('上传失败'); }
  finally { uploading.value = false; e.target.value = ''; }
}

async function remove(id) {
  if (!confirm('确认删除？')) return;
  try {
    await deleteBanner(id);
    banners.value = banners.value.filter(b => b.id !== id);
    toast.success('已删除');
  } catch { toast.error('删除失败'); }
}
</script>

<style scoped>
.desc { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1rem; }
.banner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; padding: 1rem; }
.banner-item { position: relative; aspect-ratio: 16/9; border-radius: 0.5rem; overflow: hidden; }
.banner-item img { width: 100%; height: 100%; object-fit: cover; }
.banner-num { position: absolute; bottom: 4px; left: 6px; background: rgba(0,0,0,0.5); color: white; font-size: 0.7rem; padding: 1px 5px; border-radius: 3px; }
.btn-remove { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 11px; }
.upload-slot { aspect-ratio: 16/9; border: 2px dashed var(--color-border); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.875rem; color: var(--color-text-muted); }
.upload-slot input { display: none; }
.empty { text-align: center; padding: 2rem; color: var(--color-text-muted); }
</style>
