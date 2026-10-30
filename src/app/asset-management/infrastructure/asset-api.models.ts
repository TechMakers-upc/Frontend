export interface AssetApiResource {
  readonly id: number;
  readonly plantId: number;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly criticality: string;
  readonly status: string;
  readonly statusChangedAt: string;
  readonly location: string;
  readonly brand: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly installedAt: string;
  readonly description: string;
  readonly manuals: ReadonlyArray<{
    title: string;
    url: string;
    addedAt: string;
  }>;
}

export interface SaveAssetRequest {
  readonly plantId: number;
  readonly code: string;
  readonly name: string;
  readonly category: string;
  readonly criticality: string;
  readonly location: string;
  readonly brand: string;
  readonly model: string;
  readonly serialNumber: string;
  readonly installedAt: string;
  readonly description: string;
}
