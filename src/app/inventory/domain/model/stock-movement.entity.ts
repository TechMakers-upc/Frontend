import { Entity } from '../../../shared/domain/model/entity';

export const MOVEMENT_TYPES = ['entry', 'adjustment', 'consumption'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface StockMovementProps {
  id: string;
  plantId: string;
  partId: string;
  type: MovementType;
  quantity: number;
  stockAfter: number;
  reason: string;
  at: string;
  userId: string;
  workOrderId: string | null;
}

export interface StockMovement extends StockMovementProps {}

export class StockMovement extends Entity {
  constructor(props: StockMovementProps) {
    super();
    Object.assign(this, props);
  }
}
