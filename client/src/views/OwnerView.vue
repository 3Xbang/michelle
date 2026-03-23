<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('owner.title') }}</h1>
      <button class="btn btn-primary btn-icon btn-sm" @click="openOwnerForm(null)">
        <SvgIcon name="plus" :size="16" />{{ t('owner.addOwner') }}
      </button>
    </div>

    <!-- Owner cards -->
    <div v-if="loading" class="loading-text">{{ t('common.loading') }}</div>
    <div v-else-if="owners.length === 0" class="empty-text">{{ t('common.noData') }}</div>
    <div v-else class="owner-grid">
      <div v-for="owner in owners" :key="owner.id" class="owner-card card">
        <div class="owner-card-header">
          <div class="owner-info">
            <div class="owner-name">{{ owner.name }}</div>
            <div class="owner-meta">
              <span v-if="owner.phone">📞 {{ owner.phone }}</span>
              <span v-if="owner.wechat">💬 {{ owner.wechat }}</span>
              <span v-for="c in (owner.contacts || [])" :key="c.type + c.value" class="contact-chip">{{ c.type }}: {{ c.value }}</span>
              <span v-if="owner.management_fee_rate > 0">管理费 {{ owner.management_fee_rate }}%</span>
            </div>
          </div>
          <div class="owner-stats">
            <div class="stat-num">{{ owner.room_count }}</div>
            <div class="stat-label">{{ t('owner.rooms') }}</div>
          </div>
        </div>
        <div class="owner-actions">
          <button class="btn btn-sm btn-outline" @click="toggleTemplates(owner)">
            {{ expandedOwner === owner.id ? t('common.close') : t('owner.manageTemplates') }}
          </button>
          <button class="btn btn-sm btn-outline" @click="openOwnerForm(owner)">{{ t('common.edit') }}</button>
          <button class="btn btn-sm btn-danger" @click="confirmDeleteOwner(owner)">{{ t('common.delete') }}</button>
        </div>

        <!-- Templates section -->
        <div v-if="expandedOwner === owner.id" class="templates-section">
          <div class="templates-header">
            <span class="templates-title">{{ t('owner.templates') }}</span>
            <button class="btn btn-sm btn-primary btn-icon" @click="openTemplateForm(owner.id, null)">
              <SvgIcon name="plus" :size="14" />{{ t('owner.addTemplate') }}
            </button>
          </div>
          <div v-if="loadingTemplates" class="loading-text">{{ t('common.loading') }}</div>
          <div v-else-if="!templates[owner.id]?.length" class="empty-text">{{ t('common.noData') }}</div>
          <div v-else class="template-list">
            <div v-for="tpl in templates[owner.id]" :key="tpl.id" class="template-row">
              <div class="template-info">
                <div class="template-name">{{ tpl.template_name }}</div>
                <div class="template-project" v-if="tpl.project_name">
                  <span class="project-type-badge" :class="'type-' + tpl.project_type">{{ t('enum.roomType.' + tpl.project_type) }}</span>
                  {{ tpl.project_name }}
                </div>
                <div class="template-specs">
                  🛏 {{ tpl.bedrooms }} &nbsp; 🚿 {{ tpl.bathrooms }} &nbsp; 🍳 {{ tpl.kitchens }}
                </div>
                <div class="template-prices">
                  日 {{ formatNum(tpl.daily_rate) }} &nbsp;
                  月 {{ formatNum(tpl.monthly_rate) }} &nbsp;
                  年 {{ formatNum(tpl.yearly_rate) }}
                </div>
                <div class="template-rooms">{{ tpl.room_count }} {{ t('owner.rooms') }}</div>
              </div>
              <div class="template-actions">
                <button class="btn btn-sm btn-outline" @click="openBatchCreate(tpl)">{{ t('owner.batchCreate') }}</button>
                <button class="btn btn-sm btn-primary" @click="syncPrices(tpl)" :disabled="tpl.room_count === 0">{{ t('owner.syncPrices') }}</button>
                <button class="btn btn-sm btn-outline" @click="openTemplateForm(owner.id, tpl)">{{ t('common.edit') }}</button>
                <button class="btn btn-sm btn-danger" @click="confirmDeleteTemplate(tpl)">{{ t('common.delete') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Owner Form Modal -->
    <div v-if="showOwnerForm" class="modal-overlay" @click.self="showOwnerForm = false">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingOwner ? t('owner.editOwner') : t('owner.addOwner') }}</h2>
        <form @submit.prevent="submitOwner" novalidate>
          <FormField :label="t('owner.name')" required>
            <input v-model="ownerForm.name" class="form-input" required />
          </FormField>
          <FormField :label="t('owner.nameEn')">
            <input v-model="ownerForm.name_en" class="form-input" />
          </FormField>
          <FormField :label="t('owner.phone')">
            <input v-model="ownerForm.phone" class="form-input" />
          </FormField>
          <FormField :label="t('owner.wechat')">
            <input v-model="ownerForm.wechat" class="form-input" />
          </FormField>
          <!-- 其他联系方式 -->
          <div class="contacts-section">
            <div class="contacts-label">{{ t('owner.otherContacts') }}</div>
            <div v-for="(c, idx) in ownerForm.contacts" :key="idx" class="contact-row">
              <select v-model="c.type" class="form-select contact-type">
                <option v-for="ct in CONTACT_TYPES" :key="ct" :value="ct">{{ ct }}</option>
              </select>
              <input v-model="c.value" class="form-input contact-value" :placeholder="t('owner.contactAccount')" />
              <button type="button" class="btn btn-sm btn-danger contact-remove" @click="removeContact(idx)">✕</button>
            </div>
            <button type="button" class="btn btn-sm btn-outline" @click="addContact">+ {{ t('owner.addContact') }}</button>
          </div>
          <FormField :label="t('owner.managementFeeRate')">
            <input v-model.number="ownerForm.management_fee_rate" type="number" step="0.1" min="0" max="100" class="form-input" />
          </FormField>
          <FormField :label="t('owner.notes')">
            <textarea v-model="ownerForm.notes" class="form-input" rows="2" />
          </FormField>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="showOwnerForm = false">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Template Form Modal -->
    <div v-if="showTemplateForm" class="modal-overlay" @click.self="showTemplateForm = false">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingTemplate ? t('owner.editTemplate') : t('owner.addTemplate') }}</h2>
        <form @submit.prevent="submitTemplate" novalidate>
          <FormField :label="t('owner.templateName')" required>
            <input v-model="templateForm.template_name" class="form-input" required />
          </FormField>
          <div class="form-row-2">
            <FormField :label="t('owner.projectType')" required>
              <select v-model="templateForm.project_type" class="form-select">
                <option value="apartment">{{ t('enum.roomType.apartment') }}</option>
                <option value="homestay">{{ t('enum.roomType.homestay') }}</option>
                <option value="villa">{{ t('enum.roomType.villa') }}</option>
              </select>
            </FormField>
            <FormField :label="t('owner.projectName')" required>
              <input v-model="templateForm.project_name" class="form-input" :placeholder="t('owner.projectNameHint')" required />
            </FormField>
          </div>
          <div class="form-row-3">
            <FormField :label="t('owner.bedrooms')">
              <select v-model.number="templateForm.bedrooms" class="form-select">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
            </FormField>
            <FormField :label="t('owner.bathrooms')">
              <select v-model.number="templateForm.bathrooms" class="form-select">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
            </FormField>
            <FormField :label="t('owner.kitchens')">
              <select v-model.number="templateForm.kitchens" class="form-select">
                <option v-for="n in 6" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
            </FormField>
          </div>
          <div class="form-row-3">
            <FormField :label="t('owner.dailyRate')">
              <input v-model.number="templateForm.daily_rate" type="number" step="0.01" min="0" class="form-input" />
            </FormField>
            <FormField :label="t('owner.monthlyRate')">
              <input v-model.number="templateForm.monthly_rate" type="number" step="0.01" min="0" class="form-input" />
            </FormField>
            <FormField :label="t('owner.yearlyRate')">
              <input v-model.number="templateForm.yearly_rate" type="number" step="0.01" min="0" class="form-input" />
            </FormField>
          </div>
          <FormField :label="t('owner.roomPrefix')">
            <input v-model="templateForm.room_prefix" class="form-input" :placeholder="t('owner.roomPrefixHint')" />
          </FormField>
          <FormField :label="t('owner.notes')">
            <textarea v-model="templateForm.notes" class="form-input" rows="2" />
          </FormField>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="showTemplateForm = false">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Batch Create Modal -->
    <div v-if="showBatchCreate" class="modal-overlay" @click.self="showBatchCreate = false">
      <div class="modal-content card">
        <h2 class="modal-title">{{ t('owner.batchCreate') }} — {{ batchTemplate?.template_name }}</h2>
        <form @submit.prevent="submitBatch" novalidate>
          <FormField :label="t('owner.nameCnPrefix')" required>
            <input v-model="batchForm.name_cn_prefix" class="form-input" :placeholder="t('owner.namePrefixHint')" required />
          </FormField>
          <FormField :label="t('owner.nameEnPrefix')">
            <input v-model="batchForm.name_en_prefix" class="form-input" />
          </FormField>
          <FormField :label="t('owner.roomType')" required>
            <select v-model="batchForm.room_type" class="form-select">
              <option value="villa">{{ t('enum.roomType.villa') }}</option>
              <option value="homestay">{{ t('enum.roomType.homestay') }}</option>
              <option value="apartment">{{ t('enum.roomType.apartment') }}</option>
            </select>
          </FormField>
          <div class="form-row-2">
            <FormField :label="t('owner.startNumber')" required>
              <input v-model.number="batchForm.start_number" type="number" min="1" class="form-input" required />
            </FormField>
            <FormField :label="t('owner.count')" required>
              <input v-model.number="batchForm.count" type="number" min="1" max="200" class="form-input" required />
            </FormField>
          </div>
          <div class="batch-preview" v-if="batchForm.name_cn_prefix && batchForm.count > 0">
            {{ t('owner.preview') }}: {{ batchForm.name_cn_prefix }}{{ batchForm.start_number }} ~ {{ batchForm.name_cn_prefix }}{{ batchForm.start_number + batchForm.count - 1 }}
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('owner.createRooms', { count: batchForm.count }) }}
            </button>
            <button type="button" class="btn btn-outline" @click="showBatchCreate = false">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog :visible="!!deletingOwner" :title="t('common.confirmDelete')" :message="deletingOwner?.name"
      @confirm="handleDeleteOwner" @cancel="deletingOwner = null" />
    <ConfirmDialog :visible="!!deletingTemplate" :title="t('common.confirmDelete')" :message="deletingTemplate?.template_name"
      @confirm="handleDeleteTemplate" @cancel="deletingTemplate = null" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const toast = useToast();

const owners = ref([]);
const loading = ref(false);
const submitting = ref(false);
const expandedOwner = ref(null);
const templates = ref({});
const loadingTemplates = ref(false);

// Owner form
const showOwnerForm = ref(false);
const editingOwner = ref(null);
const deletingOwner = ref(null);
const ownerForm = reactive({ name: '', name_en: '', phone: '', wechat: '', contacts: [], notes: '', management_fee_rate: 0 });

const CONTACT_TYPES = ['WeChat', 'Line', 'Facebook', 'WhatsApp', 'Telegram', 'Phone', 'Email', 'Other'];

function addContact() {
  ownerForm.contacts.push({ type: 'Line', value: '' });
}
function removeContact(idx) {
  ownerForm.contacts.splice(idx, 1);
}

// Template form
const showTemplateForm = ref(false);
const editingTemplate = ref(null);
const deletingTemplate = ref(null);
const currentOwnerId = ref(null);
const templateForm = reactive({ template_name: '', project_name: '', project_type: 'apartment', bedrooms: 1, bathrooms: 1, kitchens: 0, daily_rate: 0, monthly_rate: 0, yearly_rate: 0, room_prefix: '', notes: '' });

// Batch create
const showBatchCreate = ref(false);
const batchTemplate = ref(null);
const batchForm = reactive({ name_cn_prefix: '', name_en_prefix: '', room_type: 'apartment', start_number: 101, count: 1 });

async function fetchOwners() {
  loading.value = true;
  try { owners.value = (await apiClient.get('/owners')).data; }
  catch { owners.value = []; }
  finally { loading.value = false; }
}

async function toggleTemplates(owner) {
  if (expandedOwner.value === owner.id) { expandedOwner.value = null; return; }
  expandedOwner.value = owner.id;
  if (!templates.value[owner.id]) {
    loadingTemplates.value = true;
    try { templates.value[owner.id] = (await apiClient.get(`/owners/${owner.id}/templates`)).data; }
    catch { templates.value[owner.id] = []; }
    finally { loadingTemplates.value = false; }
  }
}

function openOwnerForm(o) {
  editingOwner.value = o;
  if (o) { ownerForm.name = o.name; ownerForm.name_en = o.name_en || ''; ownerForm.phone = o.phone || ''; ownerForm.wechat = o.wechat || ''; ownerForm.contacts = Array.isArray(o.contacts) ? JSON.parse(JSON.stringify(o.contacts)) : []; ownerForm.notes = o.notes || ''; ownerForm.management_fee_rate = o.management_fee_rate; }
  else { ownerForm.name = ''; ownerForm.name_en = ''; ownerForm.phone = ''; ownerForm.wechat = ''; ownerForm.contacts = []; ownerForm.notes = ''; ownerForm.management_fee_rate = 0; }
  showOwnerForm.value = true;
}

async function submitOwner() {
  if (!ownerForm.name.trim()) return;
  submitting.value = true;
  try {
    if (editingOwner.value) { await apiClient.put(`/owners/${editingOwner.value.id}`, ownerForm); }
    else { await apiClient.post('/owners', ownerForm); }
    toast.success(t('common.save'));
    showOwnerForm.value = false;
    fetchOwners();
  } catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
  finally { submitting.value = false; }
}

function confirmDeleteOwner(o) { deletingOwner.value = o; }
async function handleDeleteOwner() {
  try { await apiClient.delete(`/owners/${deletingOwner.value.id}`); toast.success(t('common.delete')); deletingOwner.value = null; fetchOwners(); }
  catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
}

function openTemplateForm(ownerId, tpl) {
  currentOwnerId.value = ownerId;
  editingTemplate.value = tpl;
  if (tpl) { Object.assign(templateForm, { template_name: tpl.template_name, project_name: tpl.project_name || '', project_type: tpl.project_type || 'apartment', bedrooms: tpl.bedrooms, bathrooms: tpl.bathrooms, kitchens: tpl.kitchens, daily_rate: tpl.daily_rate, monthly_rate: tpl.monthly_rate, yearly_rate: tpl.yearly_rate, room_prefix: tpl.room_prefix || '', notes: tpl.notes || '' }); }
  else { Object.assign(templateForm, { template_name: '', project_name: '', project_type: 'apartment', bedrooms: 1, bathrooms: 1, kitchens: 0, daily_rate: 0, monthly_rate: 0, yearly_rate: 0, room_prefix: '', notes: '' }); }
  showTemplateForm.value = true;
}

async function submitTemplate() {
  if (!templateForm.template_name.trim()) return;
  submitting.value = true;
  try {
    if (editingTemplate.value) { await apiClient.put(`/owners/templates/${editingTemplate.value.id}`, templateForm); }
    else { await apiClient.post(`/owners/${currentOwnerId.value}/templates`, templateForm); }
    toast.success(t('common.save'));
    showTemplateForm.value = false;
    templates.value[currentOwnerId.value] = (await apiClient.get(`/owners/${currentOwnerId.value}/templates`)).data;
  } catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
  finally { submitting.value = false; }
}

function confirmDeleteTemplate(tpl) { deletingTemplate.value = tpl; }
async function handleDeleteTemplate() {
  const ownerId = deletingTemplate.value.owner_id;
  try {
    await apiClient.delete(`/owners/templates/${deletingTemplate.value.id}`);
    toast.success(t('common.delete'));
    deletingTemplate.value = null;
    templates.value[ownerId] = (await apiClient.get(`/owners/${ownerId}/templates`)).data;
    fetchOwners();
  } catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
}

async function syncPrices(tpl) {
  try {
    const res = (await apiClient.post(`/owners/templates/${tpl.id}/sync-prices`)).data;
    toast.success(t('owner.syncSuccess', { count: res.updated }));
  } catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
}

function openBatchCreate(tpl) {
  batchTemplate.value = tpl;
  batchForm.name_cn_prefix = tpl.room_prefix || '';
  batchForm.name_en_prefix = tpl.room_prefix || '';
  batchForm.room_type = 'apartment';
  batchForm.start_number = 101;
  batchForm.count = 1;
  showBatchCreate.value = true;
}

async function submitBatch() {
  if (!batchForm.name_cn_prefix || batchForm.count < 1) return;
  submitting.value = true;
  try {
    const res = (await apiClient.post(`/owners/templates/${batchTemplate.value.id}/batch-rooms`, batchForm)).data;
    toast.success(t('owner.batchSuccess', { count: res.length }));
    showBatchCreate.value = false;
    templates.value[batchTemplate.value.owner_id] = (await apiClient.get(`/owners/${batchTemplate.value.owner_id}/templates`)).data;
    fetchOwners();
  } catch (e) { toast.error(e.response?.data?.message || t('error.unknown')); }
  finally { submitting.value = false; }
}

function formatNum(v) {
  if (!v) return '0';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

onMounted(fetchOwners);
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.page-header .page-title { margin-bottom: 0; }

.owner-grid { display: flex; flex-direction: column; gap: 1rem; }

.owner-card { padding: 1.25rem; }
.owner-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
.owner-name { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem; }
.owner-meta { display: flex; gap: 1rem; font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); flex-wrap: wrap; }
.owner-stats { text-align: center; min-width: 60px; }
.stat-num { font-size: 2rem; font-weight: 800; color: var(--color-primary, #2563eb); line-height: 1; }
.stat-label { font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); }
.owner-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.templates-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border, #e5e7eb); }
.templates-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.templates-title { font-weight: 600; font-size: 0.9375rem; }
.template-list { display: flex; flex-direction: column; gap: 0.75rem; }
.template-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.75rem; background: var(--color-bg, #f9fafb); border-radius: 8px; gap: 0.5rem; flex-wrap: wrap; }
.template-name { font-weight: 600; margin-bottom: 0.25rem; }
.template-specs { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem; }
.template-prices { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem; }
.template-rooms { font-size: 0.75rem; color: var(--color-primary, #2563eb); font-weight: 600; }
.template-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; align-items: flex-start; }

.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 0.75rem; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 0.75rem; }
.batch-preview { padding: 0.5rem 0.75rem; background: #eff6ff; border-radius: 6px; font-size: 0.875rem; color: #1d4ed8; margin-bottom: 0.5rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { width: 100%; max-width: 520px; margin: 1rem; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; }
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }

.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.8125rem; }
.btn-danger { background: #ef4444; color: #fff; border: none; }
.btn-danger:hover { background: #dc2626; }
.loading-text, .empty-text { padding: 2rem; text-align: center; color: var(--color-text-secondary, #6b7280); }

.contacts-section { margin-bottom: 0.75rem; }
.contacts-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.5rem; }
.contact-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
.contact-type { width: 130px; flex-shrink: 0; }
.contact-value { flex: 1; }
.contact-remove { flex-shrink: 0; padding: 0.25rem 0.5rem; }
.contact-chip { background: #f0fdf4; color: #166534; border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.75rem; }

.template-project { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.375rem; }
.project-type-badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.type-apartment { background: #dbeafe; color: #1d4ed8; }
.type-homestay { background: #dcfce7; color: #166534; }
.type-villa { background: #fef9c3; color: #854d0e; }
</style>
