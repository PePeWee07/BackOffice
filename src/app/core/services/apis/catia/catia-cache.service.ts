import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CatiaCacheService {
  private http = inject(HttpClient);

  private apiURL =
    environment.microservices.catiaCore.baseUrl + '/api/v1/catia/core';

  flushCache(): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}/cache/flush`);
  }
}
