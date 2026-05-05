<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { AgentUser } from '~/types/agent';
import type { ClientSummary } from '~/types/client';
import type { PropertySummary } from '~/types/property';
import { TransactionStage, TransactionType, type CreateTransactionPayload } from '~/types/transaction';

const props = defineProps<{
  isSubmitting: boolean;
  agents: AgentUser[];
  isAgentsLoading?: boolean;
  clients?: ClientSummary[];
  properties?: PropertySummary[];
  isResourcesLoading?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: CreateTransactionPayload];
}>();

const { t, getStageLabel } = useAppI18n();

const form = reactive({
  propertyTitle: '',
  propertyId: '',
  clientIds: [] as string[],
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: '',
  transactionType: ''
});

const errors = reactive({
  propertyTitle: '',
  propertyId: '',
  clientIds: '',
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: '',
  transactionType: ''
});

const showValidationSummary = ref(false);

const hasErrors = computed(() => Object.values(errors).some((value) => value.length > 0));
const hasAgents = computed(() => props.agents.length > 0);
const canSubmit = computed(
  () => !props.isSubmitting && !props.isAgentsLoading && !props.isResourcesLoading && hasAgents.value
);

const resetErrors = () => {
  errors.propertyTitle = '';
  errors.propertyId = '';
  errors.clientIds = '';
  errors.totalServiceFee = '';
  errors.listingAgentId = '';
  errors.sellingAgentId = '';
  errors.transactionType = '';
};

const resetForm = () => {
  form.propertyTitle = '';
  form.propertyId = '';
  form.clientIds = [];
  form.totalServiceFee = '';
  form.listingAgentId = '';
  form.sellingAgentId = '';
  form.transactionType = '';
  showValidationSummary.value = false;
  resetErrors();
};

const validateForm = (): boolean => {
  resetErrors();

  const totalServiceFee = Number(form.totalServiceFee);
  const trimmedPropertyTitle = form.propertyTitle.trim();

  if (!trimmedPropertyTitle) {
    errors.propertyTitle = t('transactions.form.validation.propertyTitleRequired');
  } else if (trimmedPropertyTitle.length < 3) {
    errors.propertyTitle = 'Property title must be at least 3 characters.';
  }

  if (Number.isNaN(totalServiceFee) || totalServiceFee <= 0) {
    errors.totalServiceFee = t('transactions.form.validation.totalServiceFeePositive');
  }

  if (!form.listingAgentId.trim()) {
    errors.listingAgentId = t('transactions.form.validation.listingAgentIdRequired');
  }

  if (!form.sellingAgentId.trim()) {
    errors.sellingAgentId = t('transactions.form.validation.sellingAgentIdRequired');
  }

  if (form.transactionType !== TransactionType.SOLD && form.transactionType !== TransactionType.RENTED) {
    errors.transactionType = 'Please select a transaction type.';
  }

  return !hasErrors.value;
};

const clearFieldError = (field: keyof typeof errors) => {
  errors[field] = '';
};

const onSubmit = () => {
  showValidationSummary.value = false;

  if (!validateForm()) {
    showValidationSummary.value = true;
    return;
  }

  emit('submit', {
    propertyTitle: form.propertyTitle.trim(),
    propertyId: form.propertyId || undefined,
    clientIds: form.clientIds,
    totalServiceFee: Number(form.totalServiceFee),
    listingAgentId: form.listingAgentId.trim(),
    sellingAgentId: form.sellingAgentId.trim(),
    transactionType: form.transactionType as TransactionType,
    stage: TransactionStage.AGREEMENT
  });
};

const transactionTypeLabel = (type: TransactionType) =>
  type === TransactionType.SOLD ? 'Sold' : 'Rented';

const handlePropertySelect = () => {
  clearFieldError('propertyId');
  const property = props.properties?.find((item) => item.id === form.propertyId);
  if (property && !form.propertyTitle.trim()) {
    form.propertyTitle = property.title;
    clearFieldError('propertyTitle');
  }
};
</script>

<template>
  <section class="panel overflow-hidden">
    <div class="panel-body">
      <div class="mb-6 space-y-2 border-b border-slate-100 pb-5 dark:border-slate-800">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          {{ t('transactions.header.kicker') }}
        </p>
        <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ t('transactions.form.title') }}</h3>
        <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">
          {{ t('transactions.form.description') }}
        </p>
      </div>

      <form class="grid gap-5" @submit.prevent="onSubmit" novalidate>
        <div v-if="showValidationSummary && hasErrors" class="alert-error">
          {{ t('transactions.form.validationSummary') }}
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {{ t('transactions.form.sections.dealDetails') }}
          </p>
          <div class="grid gap-4">
            <label class="block">
              <span class="field-label">{{ t('transactions.form.fields.propertyTitle') }}</span>
              <input
                v-model="form.propertyTitle"
                type="text"
                class="input-base"
                :class="{ 'input-invalid': errors.propertyTitle }"
                :aria-invalid="Boolean(errors.propertyTitle)"
                :disabled="props.isSubmitting"
                :placeholder="t('transactions.form.placeholders.propertyTitle')"
                @input="clearFieldError('propertyTitle')"
              />
              <p v-if="errors.propertyTitle" class="field-error">{{ errors.propertyTitle }}</p>
            </label>

            <label class="block">
              <span class="field-label">Linked Property</span>
              <select
                v-model="form.propertyId"
                class="input-base text-sm"
                :class="{ 'input-invalid': errors.propertyId }"
                :aria-invalid="Boolean(errors.propertyId)"
                :disabled="props.isSubmitting || props.isResourcesLoading"
                @change="handlePropertySelect"
              >
                <option value="">No linked property</option>
                <option
                  v-for="property in props.properties ?? []"
                  :key="property.id"
                  :value="property.id"
                >
                  {{ property.title }} · {{ property.city || 'No city' }} · {{ property.status }}
                </option>
              </select>
              <p class="field-hint">Optional. The text title remains available for legacy transactions.</p>
              <p v-if="errors.propertyId" class="field-error">{{ errors.propertyId }}</p>
            </label>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="field-label">{{ t('transactions.form.fields.totalServiceFee') }}</span>
                <input
                  v-model="form.totalServiceFee"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input-base"
                  :class="{ 'input-invalid': errors.totalServiceFee }"
                  :aria-invalid="Boolean(errors.totalServiceFee)"
                  :disabled="props.isSubmitting"
                  :placeholder="t('transactions.form.placeholders.totalServiceFee')"
                  @input="clearFieldError('totalServiceFee')"
                />
                <p v-if="errors.totalServiceFee" class="field-error">{{ errors.totalServiceFee }}</p>
              </label>

              <div class="block">
                <span class="field-label">{{ t('transactions.form.fields.initialStage') }}</span>
                <div
                  class="input-base flex items-center bg-slate-100 text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  aria-readonly="true"
                >
                  {{ getStageLabel(TransactionStage.AGREEMENT) }}
                </div>
                <p class="field-hint">{{ t('transactions.form.hints.initialStage') }}</p>
              </div>

              <label class="block">
                <span class="field-label">Transaction Type</span>
                <select
                  v-model="form.transactionType"
                  class="input-base text-sm"
                  :class="{ 'input-invalid': errors.transactionType }"
                  :aria-invalid="Boolean(errors.transactionType)"
                  :disabled="props.isSubmitting"
                  @change="clearFieldError('transactionType')"
                >
                  <option value="">Select Type</option>
                  <option :value="TransactionType.SOLD">{{ transactionTypeLabel(TransactionType.SOLD) }}</option>
                  <option :value="TransactionType.RENTED">{{ transactionTypeLabel(TransactionType.RENTED) }}</option>
                </select>
                <p v-if="errors.transactionType" class="field-error">{{ errors.transactionType }}</p>
              </label>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Client Links
          </p>
          <label class="block">
            <span class="field-label">Clients</span>
            <select
              v-model="form.clientIds"
              multiple
              class="input-base min-h-32 text-sm"
              :class="{ 'input-invalid': errors.clientIds }"
              :aria-invalid="Boolean(errors.clientIds)"
              :disabled="props.isSubmitting || props.isResourcesLoading"
              @change="clearFieldError('clientIds')"
            >
              <option
                v-for="client in props.clients ?? []"
                :key="client.id"
                :value="client.id"
              >
                {{ client.fullName }} · {{ client.type }}{{ client.email ? ` · ${client.email}` : '' }}
              </option>
            </select>
            <p class="field-hint">Optional. Hold Command or Ctrl to select multiple clients.</p>
            <p v-if="errors.clientIds" class="field-error">{{ errors.clientIds }}</p>
          </label>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {{ t('transactions.form.sections.agentAssignment') }}
          </p>
          <div class="grid gap-4">
            <p
              v-if="!props.isAgentsLoading && props.agents.length === 0"
              class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
            >
              {{ t('transactions.form.hints.noAgentsAvailable') }}
            </p>

            <label class="block">
              <span class="field-label">{{ t('transactions.form.fields.listingAgentId') }}</span>
              <select
                v-model="form.listingAgentId"
                class="input-base text-sm"
                :class="{ 'input-invalid': errors.listingAgentId }"
                :aria-invalid="Boolean(errors.listingAgentId)"
                :disabled="props.isSubmitting || props.isAgentsLoading"
                @change="clearFieldError('listingAgentId')"
              >
                <option value="">{{ t('transactions.form.placeholders.selectAgent') }}</option>
                <option
                  v-for="agent in props.agents"
                  :key="agent.id"
                  :value="agent.id"
                >
                  {{ agent.name }} ({{ agent.email }})
                </option>
              </select>
              <p class="field-hint">{{ t('transactions.form.hints.listingAgentId') }}</p>
              <p v-if="errors.listingAgentId" class="field-error">{{ errors.listingAgentId }}</p>
            </label>

            <label class="block">
              <span class="field-label">{{ t('transactions.form.fields.sellingAgentId') }}</span>
              <select
                v-model="form.sellingAgentId"
                class="input-base text-sm"
                :class="{ 'input-invalid': errors.sellingAgentId }"
                :aria-invalid="Boolean(errors.sellingAgentId)"
                :disabled="props.isSubmitting || props.isAgentsLoading"
                @change="clearFieldError('sellingAgentId')"
              >
                <option value="">{{ t('transactions.form.placeholders.selectAgent') }}</option>
                <option
                  v-for="agent in props.agents"
                  :key="agent.id"
                  :value="agent.id"
                >
                  {{ agent.name }} ({{ agent.email }})
                </option>
              </select>
              <p class="field-hint">{{ t('transactions.form.hints.sellingAgentId') }}</p>
              <p v-if="errors.sellingAgentId" class="field-error">{{ errors.sellingAgentId }}</p>
            </label>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            type="button"
            class="btn-secondary"
            :disabled="props.isSubmitting"
            @click="resetForm"
          >
            {{ t('transactions.actions.clear') }}
          </button>
          <button type="submit" class="btn-primary min-w-[180px]" :disabled="!canSubmit">
            {{ props.isSubmitting ? t('transactions.actions.creating') : t('transactions.actions.create') }}
          </button>
          <p
            v-if="!hasAgents && !props.isAgentsLoading"
            class="text-xs text-amber-700 dark:text-amber-300"
          >
            Register at least one active agent before creating a transaction.
          </p>
        </div>
      </form>
    </div>
  </section>
</template>
