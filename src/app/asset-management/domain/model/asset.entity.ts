import { Entity } from '../../../shared/domain/model/entity';

export const ASSET_STATUSES = ['operational', 'maintenance', 'down'] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const CRITICALITIES = ['high', 'medium', 'low'] as const;
export type Criticality = (typeof CRITICALITIES)[number];

export const ASSET_CATEGORIES = [
  'compressor',
  'press',
  'conveyor',
  'pump',
  'mixer',
  'packaging',
  'hvac',
  'electrical',
  'other',
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export interface Manual {
  title: string;
  url: string;
  addedAt: string;
}

export interface AssetProps {
  id: string;
  plantId: string;
  code: string;
  name: string;
  category: AssetCategory;
  criticality: Criticality;
  status: AssetStatus;
  statusChangedAt: string;
  location: string;
  brand: string;
  model: string;
  serialNumber: string;
  installedAt: string;
  description: string;
  manuals: Manual[];
}

export type AssetDetails = Pick<
  AssetProps,
  'code' | 'name' | 'category' | 'criticality' | 'location' | 'brand' | 'model' | 'serialNumber' | 'installedAt' | 'description'
>;

export interface Asset extends AssetProps {}

export class Asset extends Entity {
  constructor(props: AssetProps) {
    super();
    Object.assign(this, props);
  }

  updateDetails(details: AssetDetails): void {
    if (!details.code.trim() || !details.name.trim()) {
      throw new Error('An asset needs a code and a name');
    }
    Object.assign(this, details, { code: details.code.trim().toUpperCase(), name: details.name.trim() });
  }

  markDown(at: string): void {
    this.changeStatus('down', at);
  }

  markInMaintenance(at: string): void {
    this.changeStatus('maintenance', at);
  }

  markOperational(at: string): void {
    this.changeStatus('operational', at);
  }

  addManual(title: string, url: string, at: string): void {
    if (!title.trim() || !/^https?:\/\//i.test(url.trim())) {
      throw new Error('A manual needs a title and an http(s) link');
    }
    this.manuals = [...this.manuals, { title: title.trim(), url: url.trim(), addedAt: at }];
  }

  removeManual(index: number): void {
    this.manuals = this.manuals.filter((_, i) => i !== index);
  }

  private changeStatus(status: AssetStatus, at: string): void {
    if (this.status === status) return;
    this.status = status;
    this.statusChangedAt = at;
  }
}
