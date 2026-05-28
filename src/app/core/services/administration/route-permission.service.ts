import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';

import {
  RoutePermissionAssignRequest,
  RoutePermissionResponse,
  RoutePermissionSyncRequest,
} from '../../../store/User/user-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RoutePermissionService {
  private http = inject(HttpClient);

  private apiUrl = environment.backEnd.baseUrl + environment.backEnd.api.root;

  private readonly cache$ = new BehaviorSubject<RoutePermissionResponse[] | null>(null);

  readonly routePermissions$ = this.cache$.asObservable();

  get snapshot(): RoutePermissionResponse[] | null {
    return this.cache$.value;
  }

  load(forceRefresh = false): Observable<RoutePermissionResponse[]> {
    if (!forceRefresh && this.cache$.value) {
      return of(this.cache$.value);
    }

    return this.http
      .get<RoutePermissionResponse[]>(`${this.apiUrl}/route-permissions`)
      .pipe(tap((list) => this.cache$.next(list)));
  }

  assignRoles(
    routePermissionId: number,
    body: RoutePermissionAssignRequest
  ): Observable<RoutePermissionResponse> {
    return this.http
      .put<RoutePermissionResponse>(
        `${this.apiUrl}/route-permission/${routePermissionId}/roles`,
        body
      )
      .pipe(tap((updated) => this.replaceInCache(updated)));
  }

  sync(body: RoutePermissionSyncRequest): Observable<RoutePermissionResponse[]> {
    return this.http
      .post<RoutePermissionResponse[]>(`${this.apiUrl}/route-permissions/sync`, body)
      .pipe(tap((list) => this.cache$.next(list)));
  }

  getRolesForPath(path: string): string[] | undefined {
    const current = this.cache$.value;
    if (!current) {
      return undefined;
    }
    const entry = current.find((item) => item.path === path);
    return entry ? entry.roleList.map((role) => role.name) : undefined;
  }

  clear(): void {
    this.cache$.next(null);
  }

  private replaceInCache(updated: RoutePermissionResponse): void {
    const current = this.cache$.value;
    if (!current) {
      this.cache$.next([updated]);
      return;
    }
    const next = current.map((item) => (item.id === updated.id ? updated : item));
    this.cache$.next(next);
  }
}
