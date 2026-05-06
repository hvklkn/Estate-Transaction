<script setup lang="ts">
import { onMounted } from 'vue';

import TransactionCreateForm from '~/components/transactions/TransactionCreateForm.vue';
import { useAppI18n } from '~/composables/useAppI18n';
import { useAuthStore } from '~/stores/auth';
import { useClientsStore } from '~/stores/clients';
import { usePropertiesStore } from '~/stores/properties';
import { useTransactionsStore } from '~/stores/transactions';
import type { CreateTransactionPayload } from '~/types/transaction';

const transactionsStore = useTransactionsStore();
const authStore = useAuthStore();
const clientsStore = useClientsStore();
const propertiesStore = usePropertiesStore();
const { t } = useAppI18n();

useHead(() => ({
  title: t('transactions.form.title')
}));

const handleCreateTransaction = async (payload: CreateTransactionPayload) => {
  try {
    await transactionsStore.createTransaction(payload);
    await navigateTo('/transactions');
  } catch {
    // Errors are stored in Pinia state and rendered by the page.
  }
};

onMounted(async () => {
  authStore.hydrateFromStorage();
  await Promise.all([
    authStore.fetchUsers().catch(() => undefined),
    clientsStore.fetchClients({ force: true }).catch(() => undefined),
    propertiesStore.fetchProperties({ force: true }).catch(() => undefined)
  ]);
});
</script>

<template>
  <section class="space-y-6">
    <AppPageHeader
      :eyebrow="t('transactions.header.kicker')"
      :title="t('transactions.form.title')"
      :description="t('transactions.form.description')"
      meta="Create the deal record first, then advance lifecycle stages from the transaction workspace."
    >
      <template #actions>
        <NuxtLink to="/transactions" class="btn-secondary">
          {{ t('transactions.list.title') }}
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div v-if="transactionsStore.error" class="alert-error">
      <p class="font-medium">{{ t('transactions.errors.syncTitle') }}</p>
      <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ transactionsStore.error }}</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,760px)_minmax(280px,1fr)]">
      <TransactionCreateForm
        :is-submitting="transactionsStore.isCreating"
        :agents="authStore.activeUsers"
        :is-agents-loading="authStore.isLoadingUsers"
        :clients="clientsStore.items"
        :properties="propertiesStore.items"
        :is-resources-loading="clientsStore.isLoading || propertiesStore.isLoading"
        @submit="handleCreateTransaction"
      />
      <aside class="panel h-fit lg:sticky lg:top-24">
        <div class="panel-body space-y-4">
          <AppSectionHeader
            title="Creation Checklist"
            description="The form validates deal details, linked records, and agent assignment before saving."
          />
          <div class="space-y-3">
            <div class="surface-muted px-4 py-3">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Property context</p>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Link an inventory property when available, or use a standalone title for legacy records.
              </p>
            </div>
            <div class="surface-muted px-4 py-3">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Commission source</p>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The service fee becomes the basis for the stage-driven financial breakdown.
              </p>
            </div>
            <div class="surface-muted px-4 py-3">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">Agent assignment</p>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Listing and selling agents are required while the transaction is created in agreement stage.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>
