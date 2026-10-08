import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Asset, AssetProps } from '../domain/model/asset.entity';

@Injectable({ providedIn: 'root' })
export class AssetsApi extends BaseApi<Asset, AssetProps> {
  protected readonly endpointPath = environment.assetsEndpointPath;

  protected toEntity(resource: AssetProps): Asset {
    return new Asset({ ...resource, manuals: resource.manuals ?? [] });
  }
}
