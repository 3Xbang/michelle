<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? t('sales.properties.edit') : t('sales.properties.create') }}</h1>
    </div>

    <div class="card form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label required">{{ t('sales.properties.fields.name') }}</label>
            <input v-model="form.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label required">{{ t('sales.properties.fields.unitType') }}</label>
            <input v-model="form.unit_type" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label required">{{ t('sales.properties.fields.area') }}</label>
            <input v-model.number="form.area_sqm" type="number" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label required">{{ t('sales.properties.fields.price') }}</label>
            <input v-model.number="form.price" type="number" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.properties.fields.floor') }}</label>
            <input v-model="form.floor" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.properties.fields.orientation') }}</label>
            <input v-model="form.orientation" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.properties.fields.propertyType') }}</label>
            <select v-model="form.property_type" class="form-select">
              <option value="own">{{ t('sales.properties.type.own') }}</option>
              <option value="external">{{ t('sales.properties.type.external') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('sales.properties.fields.status') }}</label>
            <select v-model="form.status" class="form-select">
              <option value="available">{{ t('sales.properties.status.available') }}</option>
              <option value="reserved">{{ t('sales.properties.status.reserved') }}</option>
              <option value="sold">{{ t('sales.properties.status.sold') }}</option>
            </select>
          </div>
        </div>

        <template v-if="form.property_type === 'external'">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">{{ t('sales.properties.fields.ownerName') }}</label>
              <input v-model="form.owner_name" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label required">{{ t('sales.properties.fields.ownerContact') }}</label>
              <input v-model="form.owner_contact" class="form-input" required />
            </div>
          </div>
        </template>

        <div class="form-group">
          <label class="form-label">{{ t('sales.properties.fields.notes') }}</label>
          <textarea v-model="form.notes" class="form-input form-textarea" rows="3"></textarea>
        </div>

        <div class="form-group" v-if="isEdit">
          <label class="form-label">{{ t('sales.properties.photos') }}</label>
          <div class="photo-upload-area">
            <label class="photo-upload-btn">
              <input type="file" accept="image/*" multiple @change="handlePhotoUpload" hidden />
              + {{ t('sales.properties.uploadPhoto') }}
            </label>
          </div>
          <div v-if="photos.length" class="photo-list">
            <div v-for="ph in photos" :key="ph.id" class="photo-item">
              <img :src="ph.url" class="photo-thumb" />
              <div class="photo-actions">
                <button type="button" class="photo-star" :class="{ active: ph.is_cover }" @click="setCover(ph.id)" :title="t('sales.properties.setCover')">★</button>
                <button type="button" class="photo-del" @click="confirmDelPhoto(ph)">✕</button>
              </div>
            </div>
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

    <ConfirmDialog
      :visible="!!deletingPhoto"
      :title="t('common.confirmDelete')"
      :message="t('confirm.deleteMessage')"
      @confirm="handleDelPhoto"
      @cancel="deletingPhoto = null"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSalesPropertyStore } from '../../stores/salesProperty.js';
import { useToast } from '../../composables/useToast.js';
import ConfirmDialog from '../../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useSalesPropertyStore();
const toast = useToast();

const isEdit = computed(() => !!route.params.id);
const saving = ref(false);
const deletingPhoto = ref(null);

const form = reactive({
  name: '', unit_type: '', area_sqm: '', price: '',
  floor: '', orientation: '',
  property_type: 'own', status: 'available',
  owner_name: '', owner_contact: '', notes: '',
});

const photos = computed(() => store.currentProperty?.photos || []);

async function handlePhotoUpload(e) {
  const files = Array.from(e.target.files);
  for (const file of files) {
    try {
      await store.uploadPhoto(route.params.id, file);
    } catch (err) {
      toast.error(err.response?.data?.message || t('error.unknown'));
    }
  }
  e.target.value = '';
  toast.success(t('common.save'));
}

async function setCover(photoId) {
  try {
    await store.setCoverPhoto(route.params.id, photoId);
    toast.success(t('sales.properties.setCover'));
  } catch { toast.error(t('error.unknown')); }
}

function confirmDelPhoto(ph) { deletingPhoto.value = ph; }
async function handleDelPhoto() {
  if (!deletingPhoto.value) return;
  try {
    await store.deletePhoto(route.params.id, deletingPhoto.value.id);
    toast.success(t('common.delete'));
    deletingPhoto.value = null;
  } catch { toast.error(t('error.unknown')); }
}

async function handleSubmit() {
  saving.value = true;
  try {
    const payload = { ...form };
    if (payload.property_type !== 'external') {
      delete payload.owner_name;
      delete payload.owner_contact;
    }
    if (isEdit.value) {
      await store.updateProperty(route.params.id, payload);
      toast.success(t('common.save'));
    } else {
      const created = await store.createProperty(payload);
      toast.success(t('common.save'));
      router.replace(`/sales/properties/${created.id}`);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const p = await store.fetchProperty(route.params.id);
    Object.assign(form, {
      name: p.name || '', unit_type: p.unit_type || '',
      area_sqm: p.area_sqm || '', price: p.price || '',
      floor: p.floor || '', orientation: p.orientation || '',
      property_type: p.property_type || 'own', status: p.status || 'available',
      owner_name: p.owner_name || '', owner_contact: p.owner_contact || '',
      notes: p.notes || '',
    });
  }
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }

.form-card { padding: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
.form-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary, #111827); }
.form-label.required::after { content: ' *'; color: #ef4444; }
.form-input {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; font-size: 0.9375rem; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827);
}
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-select {
  padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-surface, #fff);
  color: var(--color-text-primary, #111827); font-size: 0.9375rem; cursor: pointer;
}

.photo-upload-area { margin-bottom: 0.75rem; }
.photo-upload-btn {
  display: inline-block; padding: 0.5rem 1rem;
  border: 1.5px dashed #93c5fd; border-radius: 8px;
  color: #2563eb; cursor: pointer; font-size: 0.875rem;
}
.photo-upload-btn:hover { background: #eff6ff; }

.photo-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.photo-item { position: relative; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 1.5px solid #e5e7eb; }
.photo-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-actions { position: absolute; top: 0; right: 0; display: flex; gap: 2px; padding: 3px; }
.photo-star {
  background: rgba(0,0,0,0.5); color: #9ca3af; border: none; cursor: pointer;
  border-radius: 4px; font-size: 0.875rem; padding: 2px 4px;
}
.photo-star.active { color: #fbbf24; }
.photo-del {
  background: rgba(239,68,68,0.8); color: #fff; border: none; cursor: pointer;
  border-radius: 4px; font-size: 0.75rem; padding: 2px 4px;
}

.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
</style>
