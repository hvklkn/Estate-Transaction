import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsMongoId, IsOptional } from 'class-validator';

import { TaskPriority } from '@/modules/tasks/domain/task-priority.enum';
import { TaskStatus } from '@/modules/tasks/domain/task-status.enum';

export const TASK_DUE_FILTERS = ['overdue', 'today', 'week'] as const;
export type TaskDueFilter = (typeof TASK_DUE_FILTERS)[number];

export class ListTasksQueryDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  assignedTo?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId()
  @IsOptional()
  relatedTransactionId?: string;

  @IsIn(TASK_DUE_FILTERS)
  @IsOptional()
  dueFilter?: TaskDueFilter;
}
