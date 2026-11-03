import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Asset, AssetProps, AssetStatus } from '../domain/model/asset.entity';
import { AssetApiMapper } from './asset-api.mapper';
import { AssetApiResource } from './asset-api.models';

@Injectable({ providedIn: 'root' })
export class AssetsApi extends BaseApi<Asset, AssetProps> {
  protected readonly endpointPath = environment.assetsEndpointPath;


  protected toEntity(resource: AssetProps): Asset {
    return new Asset({ ...resource, manuals: resource.manuals ?? [] });
  }

  override getAll(): Observable<Asset[]> {


    return this.http.get<AssetApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => AssetApiMapper.toEntity(item))),
    );
  }

  override create(entity: Asset): Observable<Asset> {


    return this.http.post<AssetApiResource>(
      this.url,
      AssetApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  override update(entity: Asset): Observable<Asset> {


    return this.http.put<AssetApiResource>(
      `${this.url}/${entity.id}`,
      AssetApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  override delete(id: string): Observable<void> {


    return this.http.delete<void>(`${this.url}/${id}`);
  }

  changeStatus(asset: Asset, status: AssetStatus, at: string): Observable<Asset> {


    return this.http.patch<AssetApiResource>(
      `${this.url}/${asset.id}/status`,
      { status },
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  addManual(asset: Asset, title: string, url: string): Observable<Asset> {


    return this.http.post<AssetApiResource>(
      `${this.url}/${asset.id}/manuals`,
      { title, url },
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }

  removeManual(asset: Asset, index: number): Observable<Asset> {


    return this.http.delete<AssetApiResource>(
      `${this.url}/${asset.id}/manuals/${index}`,
    ).pipe(
      map((resource) => AssetApiMapper.toEntity(resource)),
    );
  }
}
