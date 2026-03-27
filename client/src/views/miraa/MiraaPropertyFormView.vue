<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? '编辑房源' : '新增房源' }}</h1>
      <router-link to="/miraa/properties" class="btn btn-outline">← 返回</router-link>
    </div>

    <div class="card form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label>标题 *</label>
            <input v-model="form.title" class="form-input" required />
          </div>
          <div class="form-group">
            <label>类型 *</label>
            <select v-model="form.property_type" class="form-input" required>
              <option value="new">新房</option>
              <option value="resale">二手房</option>
              <option value="rental">出租</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格 *</label>
            <input v-model="form.price" type="number" class="form-input" required />
          </div>
          <div class="form-group">
            <label>货币</label>
            <select v-model="form.currency" class="form-input">
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="THB">THB</option>
            </select>
          </div>
          <div class="form-group">
            <label>建筑面积 (m²)</label>
            <input v-model="form.area_sqm" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>土地面积 (m²)</label>
            <input v-model="form.land_sqm" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>卧室</label>
            <input v-model="form.bedrooms" type="number" class="form-input" />
          </div>
          <div class="form-group">
            <label>浴室</label>
            <input v-model="form.bathrooms" type="number" class="form-input" />
          </div>
          <div class="form-group full">
            <label>地点</label>
            <input v-model="form.location" class="form-input" placeholder="如：Chaweng, Koh Samui" />
          </div>
          <div class="form-group full">
            <label>描述</label>
            <textarea v-model="form.description" class="form-input" rows="4" />
          </div>
          <div class="form-group full">
            <label class="toggle-label">
              <input type="checkbox" v-model="form.is_published" />
              <span>发布到 miraa.homes（勾选后网站可见）</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </form>
    </div>

    <!-- Photos section (only after create) -->
    <div v-if="propertyId" class="card photos-card">
      <h2 class="section-title">房源图片</h2>
      <div class="photos-grid">
        <div v-for="photo in photos" :key="photo.id" class="photo-item">
          <img :src="photo.url" :alt="'photo'" />
          <div class="photo-actions">
            <button v-if="!photo.is_cover" class="btn-cover" @click="setCover(photo.id)">设为封面</button>
            <span v-else class="cover-badge">封面</span>
            <button class="btn-del" @click="removePhoto(photo.id)">✕</button>
          </div>
        </div>
        <label class="upload-slot">
          <input type="file" accept="image/*" @change="uploadPhoto" :disabled="uploading" />
          <span>{{ uploading ? '上传中...' : '+ 上传图片' }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProperty, createProperty, updateProperty, uploadPropertyPhoto, deletePropertyPhoto, setCoverPhoto } from '../../api/miraa.js';
import { useToast } from '../../composables/useToast.js';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEdit = !!route.params.id;
const propertyId = ref(isEdit ? route.params.id : null);
const saving = ref(false);
const uploading = ref(false);
const photos = ref([]);

const form = reactive({
  title: '', property_type: 'new', price: '', currency: 'USD',
  area_sqm: '', land_sqm: '', bedrooms: '', bathrooms: '',
  location: '', description: '', is_published: false,
});

onMounted(async () => {
  if (isEdit) {
    try {
      const res = await getProperty(route.params.id);
      Object.assign(form, res.data);
      photos.value = res.data.photos || [];
    } catch { toast.error('加载失败'); }
  }
});

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit) {
      await updateProperty(propertyId.value, form);
      toast.success('保存成功');
    } else {
      const res = await createProperty(form);
      propertyId.value = res.data.id;
      toast.success('创建成功，现在可以上传图片');
    }
  } catch { toast.error('保存失败'); }
  finally { saving.value = false; }
}

async function uploadPhoto(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const res = await uploadPropertyPhoto(propertyId.value, file);
    photos.value.push(res.data);
    toast.success('上传成功');
  } catch { toast.error('上传失败'); }
  finally { uploading.value = false; e.target.value = ''; }
}

async function removePhoto(photoId) {
  try {
    await deletePropertyPhoto(propertyId.value, photoId);
    photos.value = photos.value.filter(p => p.id !== photoId);
  } catch { toast.error('删除失败'); }
}

async function setCover(photoId) {
  try {
    await setCoverPhoto(propertyId.value, photoId);
    photos.value = photos.value.map(p => ({ ...p, is_cover: p.id === photoId }));
  } catch { toast.error('操作失败'); }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.form-card, .photos-card { margin-bottom: 1rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); }
.form-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: 0.375rem; font-size: 0.875rem; }
textarea.form-input { resize: vertical; }
.toggle-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; }
.form-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
.section-title { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
.photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
.photo-item { position: relative; aspect-ratio: 4/3; border-radius: 0.5rem; overflow: hidden; }
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-actions { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: space-between; padding: 4px 6px; }
.btn-cover { font-size: 0.7rem; color: white; background: none; border: 1px solid white; border-radius: 3px; cursor: pointer; padding: 1px 4px; }
.cover-badge { font-size: 0.7rem; color: #fbbf24; font-weight: 600; }
.btn-del { color: white; background: none; border: none; cursor: pointer; font-size: 0.875rem; }
.upload-slot { aspect-ratio: 4/3; border: 2px dashed var(--color-border); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.875rem; color: var(--color-text-muted); }
.upload-slot input { display: none; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: 1; } }
</style>
