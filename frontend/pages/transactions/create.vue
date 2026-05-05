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
    <header
      class="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900 sm:p-7"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
            {{ t('transactions.header.kicker') }}
          </p>
          <h1 class="text-3xl font-semibold sm:text-4xl">{{ t('transactions.form.title') }}</h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {{ t('transactions.form.description') }}
          </p>
        </div>

        <NuxtLink to="/transactions" class="btn-secondary">
          {{ t('transactions.list.title') }}
        </NuxtLink>
      </div>
    </header>

    <div v-if="transactionsStore.error" class="alert-error">
      <p class="font-medium">{{ t('transactions.errors.syncTitle') }}</p>
      <p class="mt-0.5 text-xs text-rose-700/90 dark:text-rose-300">{{ transactionsStore.error }}</p>
    </div>

    <div class="max-w-3xl">
      <TransactionCreateForm
        :is-submitting="transactionsStore.isCreating"
        :agents="authStore.activeUsers"
        :is-agents-loading="authStore.isLoadingUsers"
        :clients="clientsStore.items"
        :properties="propertiesStore.items"
        :is-resources-loading="clientsStore.isLoading || propertiesStore.isLoading"
        @submit="handleCreateTransaction"
      />
    </div>
  </section>
</template>
