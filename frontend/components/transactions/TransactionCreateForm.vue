<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useAppI18n } from '~/composables/useAppI18n';
import type { AgentUser } from '~/types/agent';
import { TransactionStage, type CreateTransactionPayload } from '~/types/transaction';

const props = defineProps<{
  isSubmitting: boolean;
  agents: AgentUser[];
  isAgentsLoading?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: CreateTransactionPayload];
}>();

const { t, getStageLabel } = useAppI18n();

const form = reactive({
  propertyTitle: '',
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: ''
});

const errors = reactive({
  propertyTitle: '',
  totalServiceFee: '',
  listingAgentId: '',
  sellingAgentId: ''
});

const showValidationSummary = ref(false);

const hasErrors = computed(() => Object.values(errors).some((value) => value.length > 0));

const resetErrors = () => {
  errors.propertyTitle = '';
  errors.totalServiceFee = '';
  errors.listingAgentId = '';
  errors.sellingAgentId = '';
};

const resetForm = () => {
  form.propertyTitle = '';
  form.totalServiceFee = '';
  form.listingAgentId = '';
  form.sellingAgentId = '';
  showValidationSummary.value = false;
  resetErrors();
};

const validateForm = (): boolean => {
  resetErrors();

  const totalServiceFee = Number(form.totalServiceFee);

  if (!form.propertyTitle.trim()) {
    errors.propertyTitle = t('transactions.form.validation.propertyTitleRequired');
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
    totalServiceFee: Number(form.totalServiceFee),
    listingAgentId: form.listingAgentId.trim(),
    sellingAgentId: form.sellingAgentId.trim(),
    stage: TransactionStage.AGREEMENT
  });
};
</script>

<template>
  <section class="panel overflow-hidden">
    <div class="panel-body">
      <div class="mb-6 space-y-2 border-b border-slate-100 pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
          {{ t('transactions.header.kicker') }}
        </p>
        <h3 class="text-xl font-semibold text-slate-900">{{ t('transactions.form.title') }}</h3>
        <p class="text-sm leading-6 text-slate-500">
          {{ t('transactions.form.description') }}
        </p>
      </div>

      <form class="grid gap-5" @submit.prevent="onSubmit" novalidate>
        <div v-if="showValidationSummary && hasErrors" class="alert-error">
          {{ t('transactions.form.validationSummary') }}
        </div>

        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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
                  class="input-base flex items-center bg-slate-100 text-sm font-medium text-slate-600"
                  aria-readonly="true"
                >
                  {{ getStageLabel(TransactionStage.AGREEMENT) }}
                </div>
                <p class="field-hint">{{ t('transactions.form.hints.initialStage') }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
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

        <div class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            class="btn-secondary"
            :disabled="props.isSubmitting"
            @click="resetForm"
          >
            {{ t('transactions.actions.clear') }}
          </button>
          <button type="submit" class="btn-primary min-w-[180px]" :disabled="props.isSubmitting">
            {{ props.isSubmitting ? t('transactions.actions.creating') : t('transactions.actions.create') }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
