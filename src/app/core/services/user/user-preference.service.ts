import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LayoutState,
  initialState,
} from '../../../store/layout/layout-reducers';

interface UserPreferenceResponse {
  settings: Partial<LayoutState>;
}

interface UserPreferenceRequest {
  settings: LayoutState;
}

@Injectable({
  providedIn: 'root',
})
export class UserPreferenceService {
  private http = inject(HttpClient);

  private apiUrl =
    environment.backEnd.baseUrl +
    environment.backEnd.api.root +
    environment.backEnd.api.resoruces.user.root;

  private path = environment.backEnd.api.resoruces.user.endpoints;
  private lastPersistedLayout = JSON.stringify(initialState);
  private preferencesLoaded = false;

  loadLayoutPreferences(): Observable<LayoutState> {
    return this.http
      .get<UserPreferenceResponse>(this.apiUrl + this.path.myPreferences)
      .pipe(
        map((response) => ({
          ...initialState,
          ...(response?.settings ?? {}),
        })),
        tap((layoutState) => {
          this.lastPersistedLayout = JSON.stringify(layoutState);
          this.preferencesLoaded = true;
        })
      );
  }

  markPreferencesLoaded(): void {
    this.preferencesLoaded = true;
  }

  shouldPersistLayout(state: LayoutState): boolean {
    return (
      this.preferencesLoaded &&
      JSON.stringify(state) !== this.lastPersistedLayout
    );
  }

  updateLayoutPreferences(
    state: LayoutState
  ): Observable<UserPreferenceResponse> {
    const body: UserPreferenceRequest = {
      settings: state,
    };

    return this.http
      .patch<UserPreferenceResponse>(
        this.apiUrl + this.path.myPreferences,
        body
      )
      .pipe(
        tap(() => {
          this.lastPersistedLayout = JSON.stringify(state);
        })
      );
  }
}
