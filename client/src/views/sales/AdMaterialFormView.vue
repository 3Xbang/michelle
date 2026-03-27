<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('sales.adMaterials.edit') : t('sales.adMaterials.create') }}</h1>
    </div>

    <div class="card form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label required">{{ t('sales.adMaterials.fields.title') }}</label>
          <input v-model="form.title" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label required">{{ t('sales.adMaterials.fields.description') }}</label>
          <textarea v-model="form.description" class="form-input form-textarea" rows="5" required></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('sales.adMaterials.fields.tags') }}</label>
          <div class="tags-container">
            <span v-for="(tag, i) in form.tags" :key="i" class="tag-item">
              {{ tag }}
              <button type="button" class="tag-remove" @click="removeTag(i)">✕</button>
            </span>
            <input v-model="newTag" class="tag-input" @keydown.enter.prevent="addTag" />
          </div>
        </div>

        <div class="form-group" v-if="propertyPhotos.length">
          <label class="form-label">{{ t('sales.adMaterials.fields.photos') }}</label>
          <div class="photo-grid">
            <label v-for="ph in propertyPhotos" :key="ph.id" class="photo-select-item" :class="{ selected: form.photo_ids.includes(ph.id) }">
              <input type="checkbox" :value="ph.id" v-model="form.photo_ids" hidden />
              <img :src="ph.url" class="photo-thumb" />
              <div class="photo-check" v-if="form.photo_ids.includes(ph.id)">✓</div>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? t('common.loading') : t('common.save') }}
          </button>
          <button type="button" class="btn btn-outline" @click="router.back()">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAdMaterialStore } from '../../stores/adMaterial.js';
import { useSalesPropertyStore } from '../../stores/salesProperty.js';
import { useToast } from '../../composables/useToast.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useAdMaterialStore();
const propStore = useSalesPropertyStore();
const toast = useToast();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const newTag = ref('');
const propertyPhotos = ref([]);

const form = reactive({
  title: '', description: '', tags: [], photo_ids: [],
  property_id: route.query.property_id || '',
});

function addTag() {
  const tag = newTag.value.trim();
  if (tag && !form.tags.includes(tag)) form.tags.push(tag);
  newTag.value = '';
}
function removeTag(i) { form.tags.splice(i, 1); }

async function handleSubmit() {
  saving.value = true;
  try {
    const payload = { ...form };
    if (!payload.property_id) delete payload.property_id;
    if (isEdit.value) {
      await store.updateMaterial(route.params.id, payload);
      toast.success(t('common.save'));
      router.back();
    } else {
      const created = await store.createMaterial(payload);
      toast.success(t('common.save'));
      router.replace(`/sales/ad-materials/${created.id}/preview`);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  const propId = route.query.property_id || form.property_id;
  if (propId) {
    try {
      const p = await propStore.fetchProperty(propId);
      propertyPhotos.value = p.photos || [];
    } catch { /* ignore */ }
  }
  if (isEdit.value) {
    const m = await store.fetchMaterial(route.params.id);
    Object.assign(form, {
      title: m.title || '', description: m.description || '',
      tags: m.tags || [], photo_ids: m.photo_ids || [],
      property_id: m.property_id || '',
    });
    if (m.property_id && !propId) {
      try {
        const p = await propStore.fetchProperty(m.property_id);
        propertyPhotos.value = p.photos || [];
      } catch { /* ignore */ }
    }
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }
.form-card { padding: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
.form-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary, #111827); }
.form-label.required::after { content: ' *'; color: #ef4444; }
.form-input {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; font-size: 0.9375rem; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
}
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.form-textarea { resize: vertical; min-height: 120px; }

.tags-container {
  display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
  padding: 0.5rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; min-height: 44px; background: var(--color-surface, #fff);
}
.tag-item {
  display: inline-flex; align-items: center; gap: 0.25rem;
  background: #dbeafe; color: #1d4ed8; border-radius: 999px;
  padding: 0.2rem 0.625rem; font-size: 0.8125rem; font-weight: 600;
}
.tag-remove {
  background: none; border: none; cursor: pointer; color: #1d4ed8;
  font-size: 0.75rem; padding: 0; line-height: 1;
}
.tag-input {
  border: none; outline: none; font-size: 0.875rem; flex: 1; min-width: 100px;
  background: transparent; color: var(--color-text-primary, #111827);
}

.photo-grid { display: flex; flex-wrap: wrap; gap: 0.625rem; }
.photo-select-item {
  position: relative; width: 90px; height: 90px; border-radius: 8px; overflow: hidden;
  border: 2px solid transparent; cursor: pointer; transition: border-color 0.15s;
}
.photo-select-item.selected { border-color: #2563eb; }
.photo-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-check {
  position: absolute; inset: 0; background: rgba(37,99,235,0.3);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.5rem; font-weight: 800;
}

.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
</style>
