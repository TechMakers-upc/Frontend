import {
  Asset,
  AssetCategory,
  AssetStatus,
  Criticality,
} from '../domain/model/asset.entity';
import { AssetApiResource, SaveAssetRequest } from './asset-api.models';

export class AssetApiMapper {
  static toEntity(resource: AssetApiResource): Asset {
    return new Asset({
      id: String(resource.id),
      plantId: String(resource.plantId),
      code: resource.code,
      name: resource.name,
      category: resource.category as AssetCategory,
      criticality: resource.criticality as Criticality,
      status: resource.status as AssetStatus,
      statusChangedAt: resource.statusChangedAt,
      location: resource.location ?? '',
      brand: resource.brand ?? '',
      model: resource.model ?? '',
      serialNumber: resource.serialNumber ?? '',
      installedAt: resource.installedAt ?? '',
      description: resource.description ?? '',
      manuals: (resource.manuals ?? []).map((manual) => ({
        title: manual.title,
        url: manual.url,
        addedAt: manual.addedAt,
      })),
    });
  }

  static toSaveRequest(asset: Asset): SaveAssetRequest {
    const plantId = Number(asset.plantId);

    if (!Number.isSafeInteger(plantId) || plantId <= 0) {
      throw new Error('A valid backend plant ID is required');
    }

    return {
      plantId,
      code: asset.code,
      name: asset.name,
      category: asset.category,
      criticality: asset.criticality,
      location: asset.location,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      installedAt: asset.installedAt,
      description: asset.description,
    };
  }
}
