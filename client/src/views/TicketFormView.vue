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
          <button type="submit" class="btn btn-primary" :disabled="submitting">
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
  grid-template-columns: 1fr 1fr;
  gap: 0 1.5rem;
}

.form-full {
  grid-column: 1 / -1;
}

@media (max-width: 639px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.file-tag {
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  color: #374151;
}

/* Detail styles */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
}

.detail-full {
  grid-column: 1 / -1;
}

@media (max-width: 639px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 0.9375rem;
  color: #111827;
}

.detail-photos {
  margin-top: 1rem;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.photo-thumb {
  display: block;
  width: 120px;
  height: 120px;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.priority-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.priority-urgent {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.priority-normal {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
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
