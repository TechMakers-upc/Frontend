import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { Asset, AssetProps } from '../domain/model/asset.entity';
import { AssetApiMapper } from './asset-api.mapper';
import { AssetApiResource } from './asset-api.models';

@Injectable({ providedIn: 'root' })
export class AssetsApi extends BaseApi<Asset, AssetProps> {
  protected readonly endpointPath = environment.assetsEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: AssetProps): Asset {
    return new Asset({ ...resource, manuals: resource.manuals ?? [] });
  }

  override getAll(): Observable<Asset[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<AssetProps[]>('/demo-api/assets').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<AssetApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => AssetApiMapper.toEntity(item))),
    );
  }
}
