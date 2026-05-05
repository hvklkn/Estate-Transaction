import type { AgentSummary } from '~/types/transaction';
import type { ClientSummary } from '~/types/client';
import type { PropertySummary } from '~/types/property';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskDueFilter = 'overdue' | 'today' | 'week';

export interface RelatedTransactionSummary {
  id: string;
  propertyTitle: string;
  stage: string;
  transactionType: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  relatedTransactionId: string | null;
  relatedClientId: string | null;
  relatedPropertyId: string | null;
  assignedTo?: AgentSummary;
  relatedTransaction?: RelatedTransactionSummary;
  relatedClient?: ClientSummary;
  relatedProperty?: PropertySummary;
  createdBy?: AgentSummary;
  updatedBy?: AgentSummary;
  deletedBy?: AgentSummary;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string | null;
  relatedTransactionId?: string | null;
  relatedClientId?: string | null;
  relatedPropertyId?: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface TaskListQueryParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  relatedTransactionId?: string;
  dueFilter?: TaskDueFilter;
}

export interface TasksSummary {
  pending: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];
