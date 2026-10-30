import { Plant } from '../domain/model/plant.entity';
import { PlantApiResource, SavePlantRequest } from './plant-api.models';

export class PlantApiMapper {
  static toEntity(resource: PlantApiResource): Plant {
    return new Plant({
      id: String(resource.id),
      name: resource.name,
      city: resource.city,
      address: resource.address ?? '',
    });
  }

  static toSaveRequest(plant: Plant): SavePlantRequest {
    return {
      name: plant.name,
      city: plant.city,
      address: plant.address,
    };
  }
}
