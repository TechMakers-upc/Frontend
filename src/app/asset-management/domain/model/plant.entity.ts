import { Entity } from '../../../shared/domain/model/entity';

export interface PlantProps {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Plant extends PlantProps {}

export class Plant extends Entity {
  constructor(props: PlantProps) {
    super();
    Object.assign(this, props);
  }

  get displayName(): string {
    return this.name.toLowerCase().includes(this.city.toLowerCase()) ? this.name : `${this.name} · ${this.city}`;
  }

  updateDetails(details: Omit<PlantProps, 'id'>): void {
    if (!details.name.trim() || !details.city.trim()) {
      throw new Error('A plant needs a name and a city');
    }
    this.name = details.name.trim();
    this.city = details.city.trim();
    this.address = details.address.trim();
  }
}
