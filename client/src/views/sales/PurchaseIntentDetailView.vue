<template>
  <div>
    <div class="page-header">
      <button class="btn btn-outline btn-sm" @click="router.back()">← {{ t('common.back') }}</button>
    </div>

    <div v-if="!intent" class="loading-text">{{ t('common.loading') }}</div>
    <template v-else>
      <div class="card info-card">
        <div class="intent-header">
          <div class="intent-parties">
            <div class="party">
              <span class="party-label">{{ t('sales.viewingRecords.fields.customer') }}</span>
              <span class="party-name" @click="router.push(`/sales/customers/${intent.customer_id}`)">{{ intent.customer_name }}</span>
            </div>
            <div class="party-arrow">→</div>
            <div class="party">
              <span class="party-label">{{ t('sales.viewingRecords.fields.property') }}</span>
              <span class="party-name" @click="router.push(`/sales/properties/${intent.property_id}`)">{{ intent.property_name }}</span>
            </div>
          </div>
          <div class="level-control">
            <label class="form-label">{{ t('sales.intents.updateLevel') }}</label>
            <select v-model="currentLevel" class="form-select level-select" @change="updateLevel">
              <option value="cold">{{ t('sales.intents.level.cold') }}</option>
              <option value="warm">{{ t('sales.intents.level.warm') }}</option>
              <option value="hot">{{ t('sales.intents.level.hot') }}</option>
              <option value="signed">{{ t('sales.intents.level.signed') }}</option>
            </select>
          </div>
        </div>
        <div class="intent-meta">
          <span v-if="intent.salesperson_name">{{ t('sales.customers.salesperson') }}：{{ intent.salesperson_name }}</span>
          <span>{{ t('sales.intents.lastFollowUp') }}：{{ formatDate(intent.last_follow_up_at) }}</span>
        </div>
      </div>

      <div class="section-header">
        <h3 class="section-title">{{ t('sales.intents.followUps') }}</h3>
      </div>

      <div class="card follow-form">
        <textarea v-model="newContent" class="form-input form-textarea" :placeholder="t('sales.intents.followUpContent')" rows="3"></textarea>
        <button class="btn btn-primary btn-sm follow-submit" :disabled="!newContent.trim() || addingFollowUp" @click="addFollowUp">
          {{ addingFollowUp ? t('common.loading') : t('sales.intents.addFollowUp') }}
        </button>
      </div>

      <div v-if="store.followUps.length === 0" class="empty-text">{{ t('sales.intents.noFollowUps') }}</div>
      <div v-else class="follow-list">
        <div v-for="f in store.followUps" :key="f.id" class="follow-item card">
          <div class="follow-header">
            <span class="follow-author">{{ f.salesperson_name || t('sales.customers.salesperson') }}</span>
            <span class="follow-time">{{ formatDate(f.followed_at) }}</span>
          </div>
          <div class="follow-content">{{ f.content }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePurchaseIntentStore } from '../../stores/purchaseIntent.js';
import { useToast } from '../../composables/useToast.js';
import { intentsApi } from '../../api/sales.js';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = usePurchaseIntentStore();
const toast = useToast();

const intent = ref(null);
const currentLevel = ref('cold');
const newContent = ref('');
const addingFollowUp = ref(false);

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function updateLevel() {
  try {
    await store.updateIntentLevel(route.params.id, currentLevel.value);
    toast.success(t('sales.intents.updateLevel'));
  } catch { toast.error(t('error.unknown')); }
}

async function addFollowUp() {
  if (!newContent.value.trim()) return;
  addingFollowUp.value = true;
  try {
    await store.addFollowUp(route.params.id, { content: newContent.value.trim() });
    newContent.value = '';
    toast.success(t('sales.intents.addFollowUp'));
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.unknown'));
  } finally {
    addingFollowUp.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await intentsApi.list({});
    const rec = data.find(i => String(i.id) === String(route.params.id));
    intent.value = rec || null;
    if (rec) currentLevel.value = rec.intent_level || 'cold';
  } catch { /* ignore */ }
  await store.fetchFollowUps(route.params.id);
});
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.loading-text, .empty-text { padding: 3rem; text-align: center; color: var(--color-text-secondary, #6b7280); }
.btn-sm { padding: 0.375rem 0.875rem; font-size: 0.875rem; }
.info-card { padding: 1.25rem; margin-bottom: 1rem; }
.intent-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.intent-parties { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.party { display: flex; flex-direction: column; gap: 0.2rem; }
.party-label { font-size: 0.75rem; color: var(--color-text-secondary, #6b7280); }
.party-name { font-weight: 700; color: #2563eb; cursor: pointer; font-size: 1rem; }
.party-name:hover { text-decoration: underline; }
.party-arrow { font-size: 1.25rem; color: #9ca3af; }
.intent-meta { display: flex; gap: 1rem; font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); flex-wrap: wrap; }
.level-control { display: flex; flex-direction: column; gap: 0.25rem; }
.form-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary, #6b7280); }
.form-select { padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb); border-radius: 8px; background: var(--color-surface, #fff); color: var(--color-text-primary, #111827); font-size: 0.875rem; cursor: pointer; }
.level-select { min-width: 80px; }
.section-header { margin-bottom: 0.75rem; }
.section-title { font-size: 1rem; font-weight: 700; color: var(--color-text-primary, #111827); margin: 0; }
.follow-form { padding: 1rem; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.form-input { padding: 0.5rem 0.75rem; border: 1.5px solid var(--color-border, #e5e7eb); border-radius: 8px; font-size: 0.9375rem; background: var(--color-surface, #fff); color: var(--color-text-primary, #111827); }
.form-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.form-textarea { resize: vertical; min-height: 80px; }
.follow-submit { align-self: flex-end; }
.follow-list { display: flex; flex-direction: column; gap: 0.625rem; }
.follow-item { padding: 1rem; }
.follow-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.follow-author { font-weight: 600; font-size: 0.875rem; color: var(--color-text-primary, #111827); }
.follow-time { font-size: 0.8125rem; color: var(--color-text-secondary, #6b7280); }
.follow-content { font-size: 0.9375rem; color: var(--color-text-primary, #111827); line-height: 1.5; }
</style>
