import type { ReportExportKind, ReportFilters, ReportsSummary } from '~/types/report';

const REPORTS_SUMMARY_ENDPOINT = '/reports/summary';
const REPORTS_EXPORT_ENDPOINT = (kind: ReportExportKind) => `/reports/exports/${kind}`;

const createStoredAuthHeaders = (): HeadersInit => {
  if (!import.meta.client) {
    return {};
  }

  const token = window.localStorage.getItem('iceberg.session-token')?.trim();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toQuery = (filters: ReportFilters): Record<string, string> => {
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      query[key] = value.trim();
    }
  }

  return query;
};

const downloadTextFile = (content: string, filename: string, contentType: string) => {
  if (!import.meta.client) {
    return;
  }

  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const useReportsApi = () => {
  const api = useApi();

  return {
    getSummary(filters: ReportFilters = {}): Promise<ReportsSummary> {
      return api.request<ReportsSummary>(REPORTS_SUMMARY_ENDPOINT, {
        query: toQuery(filters),
        headers: createStoredAuthHeaders()
      });
    },

    async exportCsv(kind: ReportExportKind, filters: ReportFilters = {}): Promise<void> {
      const csv = await api.request<string>(REPORTS_EXPORT_ENDPOINT(kind), {
        query: toQuery(filters),
        headers: createStoredAuthHeaders(),
        responseType: 'text'
      });
      const dateStamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(csv, `${kind}-${dateStamp}.csv`, 'text/csv;charset=utf-8');
    }
  };
};
