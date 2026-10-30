export interface PlantApiResource {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly address: string;
  readonly displayName: string;
}

export interface SavePlantRequest {
  readonly name: string;
  readonly city: string;
  readonly address: string;
}
