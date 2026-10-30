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

  override create(entity: Asset): Observable<Asset> {
    if (!this.tokenStorage.read()) {
      return this.http.post<AssetProps>(
        '/demo-api/assets',
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<AssetApiResource>(
      this.url,
      AssetApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  override update(entity: Asset): Observable<Asset> {
    if (!this.tokenStorage.read()) {
      return this.http.put<AssetProps>(
        `/demo-api/assets/${entity.id}`,
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.put<AssetApiResource>(
      `${this.url}/${entity.id}`,
      AssetApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  override delete(id: string): Observable<void> {
    if (!this.tokenStorage.read()) {
      return this.http.delete<void>(`/demo-api/assets/${id}`);
    }

    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
