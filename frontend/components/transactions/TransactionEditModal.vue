<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import type { AgentUser } from '~/types/agent';
import type { ClientSummary } from '~/types/client';
import type { PropertySummary } from '~/types/property';
import {
  TransactionStage,
  TransactionType,
  type Transaction,
  type UpdateTransactionPayload
} from '~/types/transaction';

const props = defineProps<{
  isOpen: boolean;
  transaction: Transaction | null;
  agents: AgentUser[];
  clients?: ClientSummary[];
  properties?: PropertySummary[];
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [payload: { id: string; data: UpdateTransactionPayload }];
}>();

const form = reactive({
  propertyTitle: '',
  propertyId: '',
  clientIds: [] as string[],
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: '',
  transactionType: ''
});

const fieldErrors = reactive({
  propertyTitle: '',
  propertyId: '',
  clientIds: '',
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: '',
  transactionType: '',
  form: ''
});

const canEditWorkflowFields = computed(
  () => props.transaction?.stage === TransactionStage.AGREEMENT
);

const clearErrors = () => {
  fieldErrors.propertyTitle = '';
  fieldErrors.propertyId = '';
  fieldErrors.clientIds = '';
  fieldErrors.totalServiceFee = '';
  fieldErrors.listingAgentId = '';
  fieldErrors.sellingAgentId = '';
  fieldErrors.transactionType = '';
  fieldErrors.form = '';
};

const syncFormFromTransaction = (transaction: Transaction | null) => {
  if (!transaction) {
    return;
  }

  form.propertyTitle = transaction.propertyTitle;
  form.propertyId = transaction.propertyId ?? '';
  form.clientIds = [...transaction.clientIds];
  form.totalServiceFee = String(transaction.totalServiceFee);
  form.listingAgentId = transaction.listingAgentId;
  form.sellingAgentId = transaction.sellingAgentId;
  form.transactionType = transaction.transactionType;
  clearErrors();
};

watch(
  () => [props.transaction, props.isOpen] as const,
  ([transaction, isOpen]) => {
    if (!isOpen) {
      clearErrors();
      return;
    }

    syncFormFromTransaction(transaction);
  },
  { immediate: true }
);

const validate = () => {
  clearErrors();

  const trimmedPropertyTitle = form.propertyTitle.trim();
  const totalServiceFee = Number(form.totalServiceFee);

  if (!trimmedPropertyTitle) {
    fieldErrors.propertyTitle = 'Property title is required.';
  } else if (trimmedPropertyTitle.length < 3) {
    fieldErrors.propertyTitle = 'Property title must be at least 3 characters.';
  }

  if (canEditWorkflowFields.value) {
    if (!Number.isFinite(totalServiceFee) || totalServiceFee <= 0) {
      fieldErrors.totalServiceFee = 'Total service fee must be greater than 0.';
    }

    if (!form.listingAgentId.trim()) {
      fieldErrors.listingAgentId = 'Listing agent is required.';
    }

    if (!form.sellingAgentId.trim()) {
      fieldErrors.sellingAgentId = 'Selling agent is required.';
    }

    if (form.transactionType !== TransactionType.SOLD && form.transactionType !== TransactionType.RENTED) {
      fieldErrors.transactionType = 'Transaction type is required.';
    }
  }

  return !Object.values(fieldErrors).some((value) => value.length > 0);
};

const onSubmit = () => {
  const transaction = props.transaction;
  if (!transaction) {
    return;
  }

  if (!validate()) {
    return;
  }

  const payload: UpdateTransactionPayload = {};
  const normalizedPropertyTitle = form.propertyTitle.trim();
  if (normalizedPropertyTitle !== transaction.propertyTitle) {
    payload.propertyTitle = normalizedPropertyTitle;
  }

  if (canEditWorkflowFields.value) {
    const normalizedTotalServiceFee = Number(form.totalServiceFee);
    if (normalizedTotalServiceFee !== transaction.totalServiceFee) {
      payload.totalServiceFee = normalizedTotalServiceFee;
    }

    if (form.listingAgentId !== transaction.listingAgentId) {
      payload.listingAgentId = form.listingAgentId;
    }

    if (form.sellingAgentId !== transaction.sellingAgentId) {
      payload.sellingAgentId = form.sellingAgentId;
    }

    if (form.transactionType !== transaction.transactionType) {
      payload.transactionType = form.transactionType as TransactionType;
    }
  }

  if (form.propertyId !== (transaction.propertyId ?? '')) {
    payload.propertyId = form.propertyId || null;
  }

  const currentClientIds = [...transaction.clientIds].sort().join(',');
  const nextClientIds = [...form.clientIds].sort().join(',');
  if (currentClientIds !== nextClientIds) {
    payload.clientIds = form.clientIds;
  }

  if (Object.keys(payload).length === 0) {
    fieldErrors.form = 'No changes detected.';
    return;
  }

  emit('submit', { id: transaction.id, data: payload });
};

const onClose = () => {
  if (props.isSubmitting) {
    return;
  }

  emit('close');
};

const handlePropertySelect = () => {
  fieldErrors.propertyId = '';
  const property = props.properties?.find((item) => item.id === form.propertyId);
  if (property && !form.propertyTitle.trim()) {
    form.propertyTitle = property.title;
    fieldErrors.propertyTitle = '';
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Transaction</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update core details. After agreement stage, workflow-critical fields are locked.
            </p>
          </div>
          <button type="button" class="btn-secondary px-3 py-1.5 text-xs" :disabled="props.isSubmitting" @click="onClose">
            Close
          </button>
        </div>

        <div v-if="props.transaction" class="space-y-4">
          <div
            v-if="!canEditWorkflowFields"
            class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
          >
            This transaction is beyond agreement stage. Only property title and optional resource links can be edited.
          </div>

          <div v-if="fieldErrors.form" class="alert-error">
            {{ fieldErrors.form }}
          </div>

          <label class="block">
            <span class="field-label">Property Title</span>
            <input
              v-model="form.propertyTitle"
              type="text"
              class="input-base"
              :class="{ 'input-invalid': fieldErrors.propertyTitle }"
              :disabled="props.isSubmitting"
            />
            <p v-if="fieldErrors.propertyTitle" class="field-error">{{ fieldErrors.propertyTitle }}</p>
          </label>

          <label class="block">
            <span class="field-label">Linked Property</span>
            <select
              v-model="form.propertyId"
              class="input-base"
              :class="{ 'input-invalid': fieldErrors.propertyId }"
              :disabled="props.isSubmitting"
              @change="handlePropertySelect"
            >
              <option value="">No linked property</option>
              <option v-for="property in props.properties ?? []" :key="property.id" :value="property.id">
                {{ property.title }} · {{ property.city || 'No city' }} · {{ property.status }}
              </option>
            </select>
            <p class="field-hint">Optional. This does not replace the legacy property title field.</p>
            <p v-if="fieldErrors.propertyId" class="field-error">{{ fieldErrors.propertyId }}</p>
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="field-label">Total Service Fee (USD)</span>
              <input
                v-model="form.totalServiceFee"
                type="number"
                min="0"
                step="0.01"
                class="input-base"
                :class="{ 'input-invalid': fieldErrors.totalServiceFee }"
                :disabled="props.isSubmitting || !canEditWorkflowFields"
              />
              <p v-if="fieldErrors.totalServiceFee" class="field-error">{{ fieldErrors.totalServiceFee }}</p>
            </label>

            <label class="block">
              <span class="field-label">Transaction Type</span>
              <select
                v-model="form.transactionType"
                class="input-base"
                :class="{ 'input-invalid': fieldErrors.transactionType }"
                :disabled="props.isSubmitting || !canEditWorkflowFields"
              >
                <option :value="TransactionType.SOLD">Sold</option>
                <option :value="TransactionType.RENTED">Rented</option>
              </select>
              <p v-if="fieldErrors.transactionType" class="field-error">{{ fieldErrors.transactionType }}</p>
            </label>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="field-label">Listing Agent</span>
              <select
                v-model="form.listingAgentId"
                class="input-base"
                :class="{ 'input-invalid': fieldErrors.listingAgentId }"
                :disabled="props.isSubmitting || !canEditWorkflowFields"
              >
                <option value="">Select agent</option>
                <option v-for="agent in props.agents" :key="agent.id" :value="agent.id">
                  {{ agent.name }} ({{ agent.email }})
                </option>
              </select>
              <p v-if="fieldErrors.listingAgentId" class="field-error">{{ fieldErrors.listingAgentId }}</p>
            </label>

            <label class="block">
              <span class="field-label">Selling Agent</span>
              <select
                v-model="form.sellingAgentId"
                class="input-base"
                :class="{ 'input-invalid': fieldErrors.sellingAgentId }"
                :disabled="props.isSubmitting || !canEditWorkflowFields"
              >
                <option value="">Select agent</option>
                <option v-for="agent in props.agents" :key="agent.id" :value="agent.id">
                  {{ agent.name }} ({{ agent.email }})
                </option>
              </select>
              <p v-if="fieldErrors.sellingAgentId" class="field-error">{{ fieldErrors.sellingAgentId }}</p>
            </label>
          </div>

          <label class="block">
            <span class="field-label">Clients</span>
            <select
              v-model="form.clientIds"
              multiple
              class="input-base min-h-32"
              :class="{ 'input-invalid': fieldErrors.clientIds }"
              :disabled="props.isSubmitting"
            >
              <option v-for="client in props.clients ?? []" :key="client.id" :value="client.id">
                {{ client.fullName }} · {{ client.type }}{{ client.email ? ` · ${client.email}` : '' }}
              </option>
            </select>
            <p class="field-hint">Optional. Hold Command or Ctrl to select multiple clients.</p>
            <p v-if="fieldErrors.clientIds" class="field-error">{{ fieldErrors.clientIds }}</p>
          </label>

          <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" class="btn-secondary" :disabled="props.isSubmitting" @click="onClose">
              Cancel
            </button>
            <button type="button" class="btn-primary" :disabled="props.isSubmitting" @click="onSubmit">
              {{ props.isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
