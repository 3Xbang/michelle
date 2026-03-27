<template>
  <div>
    <h1 class="page-title">Miraa 联系方式</h1>
    <p class="desc">设置 miraa.homes 网站上显示的联系方式。</p>

    <div class="card">
      <form @submit.prevent="save">
        <div class="form-group">
          <label>WhatsApp 号码</label>
          <input v-model="form.miraa_whatsapp" class="form-input" placeholder="如：66812345678" />
          <span class="hint">国家码 + 号码，不含 + 号</span>
        </div>
        <div class="form-group">
          <label>LINE ID</label>
          <input v-model="form.miraa_line_id" class="form-input" placeholder="如：mira_samui" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getSettings, updateSettings } from '../../api/miraa.js';
import { useToast } from '../../composables/useToast.js';

const toast = useToast();
const saving = ref(false);
const form = reactive({ miraa_whatsapp: '', miraa_line_id: '' });

onMounted(async () => {
  try { const res = await getSettings(); Object.assign(form, res.data); }
  catch { toast.error('加载失败'); }
});

async function save() {
  saving.value = true;
  try { await updateSettings(form); toast.success('保存成功'); }
  catch { toast.error('保存失败'); }
  finally { saving.value = false; }
}
</script>

<style scoped>
.desc { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.875rem; font-weight: 500; }
.form-input { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border); border-radius: 0.375rem; font-size: 0.875rem; }
.hint { font-size: 0.75rem; color: var(--color-text-muted); }
.form-actions { padding-top: 1rem; border-top: 1px solid var(--color-border); }
</style>
