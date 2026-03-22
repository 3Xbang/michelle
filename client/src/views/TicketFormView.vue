<template>
  <div>
    <h1 class="page-title">{{ isDetail ? t('ticket.detailTitle') : t('ticket.createTitle') }}</h1>

    <div class="card">
      <!-- Detail Mode -->
      <div v-if="isDetail && ticket">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">{{ t('booking.room') }}</span>
            <span class="detail-value">{{ ticket.room_name_cn || ticket.room_name || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('ticket.issueType') }}</span>
            <span class="detail-value">{{ t('enum.issueType.' + ticket.issue_type) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('ticket.priority') }}</span>
            <span class="detail-value">
              <span class="priority-badge" :class="'priority-' + ticket.priority">
                {{ t('enum.priority.' + ticket.priority) }}
              </span>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('common.status') }}</span>
            <span class="detail-value">
              <span class="status-badge" :class="'status-' + ticket.ticket_status">
                <SvgIcon :name="statusIcon(ticket.ticket_status)" :size="14" />
                {{ t('enum.ticketStatus.' + ticket.ticket_status) }}
              </span>
            </span>
          </div>
          <div class="detail-item detail-full">
            <span class="detail-label">{{ t('common.description') }}</span>
            <span class="detail-value">{{ ticket.description }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t('common.createdAt') }}</span>
            <span class="detail-value">{{ ticket.created_at }}</span>
          </div>
          <div v-if="ticket.completed_at" class="detail-item">
            <span class="detail-label">{{ t('ticket.completedAt') }}</span>
            <span class="detail-value">{{ ticket.completed_at }}</span>
          </div>
        </div>

        <!-- Photos -->
        <div v-if="ticket.photo_urls && ticket.photo_urls.length" class="detail-photos">
          <span class="detail-label">{{ t('ticket.photos') }}</span>
          <div class="photo-grid">
            <a
              v-for="(url, idx) in ticket.photo_urls"
              :key="idx"
              :href="url"
              target="_blank"
              class="photo-thumb"
            >
              <img :src="url" :alt="'Photo ' + (idx + 1)" />
            </a>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/tickets" class="btn btn-outline">{{ t('common.back') }}</router-link>
        </div>
      </div>

      <!-- Create Mode -->
      <form v-else @submit.prevent="handleSubmit" novalidate>
        <div class="form-grid">
          <!-- Room -->
          <FormField :label="t('booking.room')" :error="errors.room_id" required>
            <select v-model="form.room_id" class="form-select" @blur="validate('room_id')">
              <option value="">--</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.room_name_cn }} / {{ room.room_name_en }}
              </option>
            </select>
          </FormField>

          <!-- Issue Type -->
          <FormField :label="t('ticket.issueType')" :error="errors.issue_type" required>
            <select v-model="form.issue_type" class="form-select" @blur="validate('issue_type')">
              <option value="">--</option>
              <option v-for="it in issueTypes" :key="it" :value="it">
                {{ t('enum.issueType.' + it) }}
              </option>
            </select>
          </FormField>

          <!-- Priority -->
          <FormField :label="t('ticket.priority')" :error="errors.priority" required>
            <select v-model="form.priority" class="form-select" @blur="validate('priority')">
              <option value="normal">{{ t('enum.priority.normal') }}</option>
              <option value="urgent">{{ t('enum.priority.urgent') }}</option>
            </select>
          </FormField>

          <!-- Description -->
          <FormField :label="t('common.description')" :error="errors.description" required class="form-full">
            <textarea v-model="form.description" class="form-input form-textarea" rows="4" @blur="validate('description')"></textarea>
          </FormField>

          <!-- Photo Upload -->
          <FormField :label="t('ticket.photos')" class="form-full">
            <input type="file" multiple accept="image/*" class="form-input" @change="handleFileChange" />
            <div v-if="selectedFiles.length" class="file-list">
              <span v-for="(f, idx) in selectedFiles" :key="idx" class="file-tag">{{ f.name }}</span>
            </div>
          </FormField>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-icon" :disabled="submitting">
            <SvgIcon name="save" :size="18" />
            {{ submitting ? t('common.loading') : t('common.submit') }}
          </button>
          <router-link to="/tickets" class="btn btn-outline">{{ t('common.cancel') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useTicketStore } from '../stores/ticket.js';
import { useToast } from '../composables/useToast.js';
import { useValidation, required as requiredRule } from '../composables/useValidation.js';
import apiClient from '../api/client.js';
import FormField from '../components/common/FormField.vue';
import SvgIcon from '../components/icons/SvgIcon.vue';

const STATUS_ICON_MAP = {
  pending: 'clock',
  checked_in: 'check',
  completed: 'check',
  checked_out: 'close',
  urgent: 'warning',
  active: 'check',
  maintenance: 'warning',
};

function statusIcon(status) {
  return STATUS_ICON_MAP[status] || 'clock';
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const ticketStore = useTicketStore();
const toast = useToast();

const issueTypes = ['plumbing', 'furniture', 'cleaning', 'network', 'other'];

const isDetail = computed(() => route.name === 'TicketDetail');
const rooms = ref([]);
const ticket = ref(null);
const submitting = ref(false);
const selectedFiles = ref([]);

const form = reactive({
  room_id: '',
  issue_type: '',
  description: '',
  priority: 'normal',
});

const { errors, validateField, validateAll } = useValidation({
  room_id: [requiredRule(t('validation.required'))],
  issue_type: [requiredRule(t('validation.required'))],
  description: [requiredRule(t('validation.required'))],
  priority: [requiredRule(t('validation.required'))],
});

function validate(field) {
  validateField(field, form[field]);
}

function handleFileChange(e) {
  selectedFiles.value = Array.from(e.target.files || []);
}

async function handleSubmit() {
  if (!validateAll(form)) return;

  submitting.value = true;
  try {
    const fd = new FormData();
    fd.append('room_id', form.room_id);
    fd.append('issue_type', form.issue_type);
    fd.append('description', form.description.trim());
    fd.append('priority', form.priority);
    for (const file of selectedFiles.value) {
      fd.append('photos', file);
    }

    await ticketStore.createTicket(fd);
    toast.success(t('ticket.createTitle'));
    router.push('/tickets');
  } catch (err) {
    const msg = err.response?.data?.message || t('error.unknown');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}

async function loadRooms() {
  try {
    const { data } = await apiClient.get('/rooms');
    rooms.value = Array.isArray(data) ? data : (data.data || []);
  } catch {
    rooms.value = [];
  }
}

async function loadTicket() {
  if (!isDetail.value) return;
  try {
    const data = await ticketStore.getTicket(route.params.id);
    ticket.value = data;
  } catch (err) {
    toast.error(err.response?.data?.message || t('error.notFound'));
    router.push('/tickets');
  }
}

onMounted(() => {
  loadRooms();
  loadTicket();
});
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0 var(--spacing-lg);
  }
}

.form-full {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.form-actions .btn {
  width: 100%;
}

@media (min-width: 640px) {
  .form-actions {
    flex-direction: row;
  }

  .form-actions .btn {
    width: auto;
  }
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.file-tag {
  background: var(--color-border-light);
  padding: 0.125rem var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* Detail styles */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md) 0;
}

@media (min-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md) var(--spacing-lg);
  }
}

.detail-full {
  grid-column: 1 / -1;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.detail-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.detail-photos {
  margin-top: var(--spacing-md);
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: var(--spacing-sm);
}

.photo-thumb {
  display: block;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.priority-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.priority-urgent {
  background: #fef2f2;
  color: var(--color-danger-hover);
  border: 1px solid #fecaca;
}

.priority-normal {
  background: var(--color-border-light);
  color: var(--color-text-muted);
}

.status-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.status-pending {
  background: #fef9c3;
  color: #a16207;
}

.status-completed {
  background: #dcfce7;
  color: #15803d;
}
</style>
