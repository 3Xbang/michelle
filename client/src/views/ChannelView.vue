<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">{{ t('channel.title') }}</h1>
    </div>

    <!-- Tab buttons -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'platform' }" @click="activeTab = 'platform'">
        {{ t('channel.platforms') }}
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'agent' }" @click="activeTab = 'agent'">
        {{ t('channel.agents') }}
      </button>
    </div>

    <!-- Platform tab -->
    <div v-if="activeTab === 'platform'">
      <div class="section-header">
        <button class="btn btn-primary btn-icon btn-sm" @click="openPlatformForm(null)">
          <SvgIcon name="plus" :size="16" />
          {{ t('channel.addPlatform') }}
        </button>
      </div>
      <div class="card">
        <DataTable
          :columns="platformColumns"
          :data="platforms"
          :loading="loadingPlatforms"
          :card-mode="!isDesktop"
          card-title-key="name"
        >
          <template #cell-commission_rate="{ row }">{{ row.commission_rate }}%</template>
          <template #cell-tax_rate="{ row }">{{ row.tax_rate }}%</template>
          <template #cell-actions="{ row }">
            <div class="action-btns">
              <button class="btn btn-sm btn-outline" @click="viewBookings('platform', row)">{{ t('channel.viewBills') }}</button>
              <button class="btn btn-sm btn-outline" @click="openPlatformForm(row)">{{ t('common.edit') }}</button>
              <button class="btn btn-sm btn-danger" @click="confirmDeletePlatform(row)">{{ t('common.delete') }}</button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Agent tab -->
    <div v-if="activeTab === 'agent'">
      <div class="section-header">
        <button class="btn btn-primary btn-icon btn-sm" @click="openAgentForm(null)">
          <SvgIcon name="plus" :size="16" />
          {{ t('channel.addAgent') }}
        </button>
      </div>
      <div class="card">
        <DataTable
          :columns="agentColumns"
          :data="agents"
          :loading="loadingAgents"
          :card-mode="!isDesktop"
          card-title-key="name"
        >
          <template #cell-actions="{ row }">
            <div class="action-btns">
              <button class="btn btn-sm btn-outline" @click="viewBookings('agent', row)">{{ t('channel.viewBills') }}</button>
              <button class="btn btn-sm btn-outline" @click="openAgentForm(row)">{{ t('common.edit') }}</button>
              <button class="btn btn-sm btn-danger" @click="confirmDeleteAgent(row)">{{ t('common.delete') }}</button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Platform Form Modal -->
    <div v-if="showPlatformForm" class="modal-overlay" @click.self="showPlatformForm = false">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingPlatform ? t('channel.editPlatform') : t('channel.addPlatform') }}</h2>
        <form @submit.prevent="submitPlatform" novalidate>
          <FormField :label="t('channel.name')" required>
            <input v-model="platformForm.name" class="form-input" required />
          </FormField>
          <FormField :label="t('channel.commissionRate')">
            <input v-model.number="platformForm.commission_rate" type="number" step="0.01" min="0" max="100" class="form-input" />
          </FormField>
          <FormField :label="t('channel.taxRate')">
            <input v-model.number="platformForm.tax_rate" type="number" step="0.01" min="0" max="100" class="form-input" />
          </FormField>
          <FormField :label="t('channel.notes')">
            <textarea v-model="platformForm.notes" class="form-input" rows="2" />
          </FormField>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="showPlatformForm = false">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Agent Form Modal -->
    <div v-if="showAgentForm" class="modal-overlay" @click.self="showAgentForm = false">
      <div class="modal-content card">
        <h2 class="modal-title">{{ editingAgent ? t('channel.editAgent') : t('channel.addAgent') }}</h2>
        <form @submit.prevent="submitAgent" novalidate>
          <FormField :label="t('channel.name')" required>
            <input v-model="agentForm.name" class="form-input" required />
          </FormField>
          <FormField :label="t('channel.phone')">
            <input v-model="agentForm.phone" class="form-input" />
          </FormField>
          <FormField :label="t('channel.notes')">
            <textarea v-model="agentForm.notes" class="form-input" rows="2" />
          </FormField>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? t('common.loading') : t('common.save') }}
            </button>
            <button type="button" class="btn btn-outline" @click="showAgentForm = false">{{ t('common.cancel') }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bills Modal -->
    <div v-if="showBills" class="modal-overlay" @click.self="showBills = false">
      <div class="modal-content modal-wide card">
        <h2 class="modal-title">{{ billsTitle }} — {{ t('channel.bills') }}</h2>
        <div v-if="loadingBills" class="loading-text">{{ t('common.loading') }}</div>
        <div v-else-if="bills.length === 0" class="empty-text">{{ t('common.noData') }}</div>
        <table v-else class="bills-table">
          <thead>
            <tr>
              <th>{{ t('booking.guestName') }}</th>
              <th>{{ t('booking.checkIn') }}</th>
              <th>{{ t('booking.checkOut') }}</th>
              <th>{{ t('booking.totalRevenue') }}</th>
              <th>{{ t('booking.netIncome') }}</th>
              <th>{{ t('booking.bookingStatus') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bills" :key="b.id">
              <td>{{ b.guest_name }}</td>
              <td>{{ b.check_in?.slice(0, 10) }}</td>
              <td>{{ b.check_out?.slice(0, 10) }}</td>
              <td>{{ formatNum(b.total_revenue) }}</td>
              <td>{{ formatNum(b.net_income) }}</td>
              <td>{{ t('enum.bookingStatus.' + b.booking_status) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>{{ t('report.summary') }}</strong></td>
              <td><strong>{{ formatNum(bills.reduce((s, b) => s + Number(b.total_revenue), 0)) }}</strong></td>
              <td><strong>{{ formatNum(bills.reduce((s, b) => s + Number(b.net_income), 0)) }}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <div class="form-actions">
          <button class="btn btn-outline" @click="showBills = false">{{ t('common.close') }}</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="!!deletingPlatform"
      :title="t('common.confirmDelete')"
      :message="deletingPlatform?.name"
      @confirm="handleDeletePlatform"
      @cancel="deletingPlatform = null"
    />
    <ConfirmDialog
      :visible="!!deletingAgent"
      :title="t('common.confirmDelete')"
      :message="deletingAgent?.name"
      @confirm="handleDeleteAgent"
      @cancel="deletingAgent = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { useToast } from '../composables/useToast.js';
import apiClient from '../api/client.js';
import DataTable from '../components/common/DataTable.vue';
import FormField from '../components/common/FormField.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

const { t } = useI18n();
const isDesktop = useMediaQuery('(min-width: 768px)');
const toast = useToast();

const activeTab = ref('platform');

// --- Platforms ---
const platforms = ref([]);
const loadingPlatforms = ref(false);
const showPlatformForm = ref(false);
const editingPlatform = ref(null);
const deletingPlatform = ref(null);
const submitting = ref(false);
const platformForm = reactive({ name: '', commission_rate: 0, tax_rate: 0, notes: '' });

const platformColumns = computed(() => [
  { key: 'name', label: t('channel.name') },
  { key: 'commission_rate', label: t('channel.commissionRate') },
  { key: 'tax_rate', label: t('channel.taxRate') },
  { key: 'notes', label: t('channel.notes') },
  { key: 'actions', label: '' },
]);

async function fetchPlatforms() {
  loadingPlatforms.value = true;
  try { platforms.value = await (await apiClient.get('/platforms')).data; }
  catch { platforms.value = []; }
  finally { loadingPlatforms.value = false; }
}

function openPlatformForm(p) {
  editingPlatform.value = p;
  if (p) {
    platformForm.name = p.name;
    platformForm.commission_rate = p.commission_rate;
    platformForm.tax_rate = p.tax_rate;
    platformForm.notes = p.notes || '';
  } else {
    platformForm.name = ''; platformForm.commission_rate = 0;
    platformForm.tax_rate = 0; platformForm.notes = '';
  }
  showPlatformForm.value = true;
}

async function submitPlatform() {
  if (!platformForm.name.trim()) return;
  submitting.value = true;
  try {
    if (editingPlatform.value) {
      await apiClient.put(`/platforms/${editingPlatform.value.id}`, platformForm);
    } else {
      await apiClient.post('/platforms', platformForm);
    }
    toast.success(t('common.save'));
    showPlatformForm.value = false;
    fetchPlatforms();
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally { submitting.value = false; }
}

function confirmDeletePlatform(p) { deletingPlatform.value = p; }
async function handleDeletePlatform() {
  try {
    await apiClient.delete(`/platforms/${deletingPlatform.value.id}`);
    toast.success(t('common.delete'));
    deletingPlatform.value = null;
    fetchPlatforms();
  } catch (err) { toast.error(err.response?.data?.message || t('error.unknown')); }
}

// --- Agents ---
const agents = ref([]);
const loadingAgents = ref(false);
const showAgentForm = ref(false);
const editingAgent = ref(null);
const deletingAgent = ref(null);
const agentForm = reactive({ name: '', phone: '', notes: '' });

const agentColumns = computed(() => [
  { key: 'name', label: t('channel.name') },
  { key: 'phone', label: t('channel.phone') },
  { key: 'notes', label: t('channel.notes') },
  { key: 'actions', label: '' },
]);

async function fetchAgents() {
  loadingAgents.value = true;
  try { agents.value = await (await apiClient.get('/agents')).data; }
  catch { agents.value = []; }
  finally { loadingAgents.value = false; }
}

function openAgentForm(a) {
  editingAgent.value = a;
  if (a) { agentForm.name = a.name; agentForm.phone = a.phone || ''; agentForm.notes = a.notes || ''; }
  else { agentForm.name = ''; agentForm.phone = ''; agentForm.notes = ''; }
  showAgentForm.value = true;
}

async function submitAgent() {
  if (!agentForm.name.trim()) return;
  submitting.value = true;
  try {
    if (editingAgent.value) {
      await apiClient.put(`/agents/${editingAgent.value.id}`, agentForm);
    } else {
      await apiClient.post('/agents', agentForm);
    }
    toast.success(t('common.save'));
    showAgentForm.value = false;
    fetchAgents();
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally { submitting.value = false; }
}

function confirmDeleteAgent(a) { deletingAgent.value = a; }
async function handleDeleteAgent() {
  try {
    await apiClient.delete(`/agents/${deletingAgent.value.id}`);
    toast.success(t('common.delete'));
    deletingAgent.value = null;
    fetchAgents();
  } catch (err) { toast.error(err.response?.data?.message || t('error.unknown')); }
}

// --- Bills ---
const showBills = ref(false);
const bills = ref([]);
const loadingBills = ref(false);
const billsTitle = ref('');

async function viewBookings(type, item) {
  billsTitle.value = item.name;
  showBills.value = true;
  loadingBills.value = true;
  bills.value = [];
  try {
    const url = type === 'platform' ? `/platforms/${item.id}/bookings` : `/agents/${item.id}/bookings`;
    bills.value = (await apiClient.get(url)).data;
  } catch { bills.value = []; }
  finally { loadingBills.value = false; }
}

function formatNum(v) {
  if (v == null) return '-';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

onMounted(() => { fetchPlatforms(); fetchAgents(); });
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.page-header .page-title { margin-bottom: 0; }

.tab-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface, #fff);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-secondary, #6b7280);
}

.tab-btn.active {
  border-color: var(--color-primary, #2563eb);
  background: var(--color-primary, #2563eb);
  color: #fff;
}

.section-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.action-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.8125rem; }
.btn-danger { background: #ef4444; color: #fff; border: none; }
.btn-danger:hover { background: #dc2626; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 100%; max-width: 480px;
  margin: 1rem; max-height: 90vh; overflow-y: auto;
}
.modal-wide { max-width: 760px; }
.modal-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; }
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }

.bills-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.bills-table th, .bills-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
.bills-table th { background: #f9fafb; font-weight: 600; }
.bills-table tfoot td { border-top: 2px solid #e5e7eb; border-bottom: none; }

.loading-text, .empty-text { padding: 2rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
</style>
