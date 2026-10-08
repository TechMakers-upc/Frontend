import { BadgeTone } from '../../shared/presentation/components/status-badge/status-badge';
import { AssetStatus, Criticality } from '../domain/model/asset.entity';

export const ASSET_STATUS_TONE: Record<AssetStatus, BadgeTone> = {
  operational: 'ok',
  maintenance: 'warn',
  down: 'down',
};

export const CRITICALITY_TONE: Record<Criticality, BadgeTone> = {
  high: 'down',
  medium: 'warn',
  low: 'neutral',
};
