import { Entity } from '../../../shared/domain/model/entity';

export const PART_CATEGORIES = [
  'electrical',
  'mechanical',
  'pneumatic',
  'hydraulic',
  'consumable',
] as const;
export type PartCategory = (typeof PART_CATEGORIES)[number];

export const PART_UNITS = ['unit', 'liter', 'meter', 'kit'] as const;
export type PartUnit = (typeof PART_UNITS)[number];

export type StockLevel = 'out' | 'low' | 'ok';

export interface SparePartProps {
  id: string;
  plantId: string;
  sku: string;
  name: string;
  category: PartCategory;
  unit: PartUnit;
  stock: number;
  minStock: number;
  location: string;
}

export type SparePartDetails = Pick<
  SparePartProps,
  'sku' | 'name' | 'category' | 'unit' | 'minStock' | 'location'
>;


export interface SparePart extends SparePartProps {}

export class SparePart extends Entity {
  constructor(props: SparePartProps) {
    super();
    Object.assign(this, props);
  }

  get level(): StockLevel {
    if (this.stock <= 0) return 'out';
    return this.stock <= this.minStock ? 'low' : 'ok';
  }

  get isBelowMinimum(): boolean {
    return this.level !== 'ok';
  }

  updateDetails(details: SparePartDetails): void {
    if (!details.sku.trim() || !details.name.trim())
      throw new Error('A part needs a SKU and a name');
    SparePart.assertQuantity(details.minStock);
    Object.assign(this, details, {
      sku: details.sku.trim().toUpperCase(),
      name: details.name.trim(),
    });
  }

  receive(quantity: number): void {
    if (quantity < 1) throw new Error('Entries must add at least one unit');
    SparePart.assertQuantity(quantity);
    this.stock += quantity;
  }


  adjustTo(counted: number): number {
    SparePart.assertQuantity(counted);
    const delta = counted - this.stock;
    this.stock = counted;
    return delta;
  }

  consume(quantity: number): void {
    if (quantity < 1) throw new Error('Consumption must be at least one unit');
    if (quantity > this.stock) throw new Error('Not enough stock');
    this.stock -= quantity;
  }

  static assertQuantity(value: number): void {
    if (!Number.isInteger(value) || value < 0)
      throw new Error('Quantities are whole, non-negative numbers');
  }
}
