import { BadgeTone } from '../../shared/presentation/components/status-badge/status-badge';
import { StockLevel } from '../domain/model/spare-part.entity';
import { MovementType } from '../domain/model/stock-movement.entity';

export const STOCK_LEVEL_TONE: Record<StockLevel, BadgeTone> = {
  out: 'down',
  low: 'warn',
  ok: 'ok',
};

export const MOVEMENT_TONE: Record<MovementType, BadgeTone> = {
  entry: 'ok',
  adjustment: 'neutral',
  consumption: 'info',
};
