import { BadgeTone } from '../../shared/presentation/components/status-badge/status-badge';
import { FailureStatus } from '../domain/model/failure.entity';
import { Priority } from '../domain/model/priority';
import { WorkOrderStatus } from '../domain/model/work-order.entity';

export const WORK_ORDER_STATUS_TONE: Record<WorkOrderStatus, BadgeTone> = {
  pending: 'warn',
  'in-progress': 'info',
  completed: 'ok',
};

export const PRIORITY_TONE: Record<Priority, BadgeTone> = {
  critical: 'down',
  high: 'warn',
  medium: 'info',
  low: 'neutral',
};

export const FAILURE_STATUS_TONE: Record<FailureStatus, BadgeTone> = {
  open: 'down',
  'in-progress': 'info',
  resolved: 'ok',
};
