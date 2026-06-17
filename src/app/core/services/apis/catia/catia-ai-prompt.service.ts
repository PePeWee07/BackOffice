import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CatiaAiPromptConfig,
  CatiaAiPromptConfigUpdate,
} from './models/catia-ai-prompt';

/**
 * Administración de la configuración del prompt de CatIA.
 * Consume el proxy del back-end: /api/v1/catia/core/ai-prompt-config.
 */
@Injectable({
  providedIn: 'root',
})
export class CatiaAiPromptService {
  private http = inject(HttpClient);

  private apiURL =
    environment.microservices.catiaCore.baseUrl +
    '/api/v1/catia/core/ai-prompt-config';

  getConfig(): Observable<CatiaAiPromptConfig> {
    return this.http.get<CatiaAiPromptConfig>(this.apiURL);
  }

  updateConfig(
    body: CatiaAiPromptConfigUpdate
  ): Observable<CatiaAiPromptConfig> {
    return this.http.put<CatiaAiPromptConfig>(this.apiURL, body);
  }

  seedDefault(): Observable<CatiaAiPromptConfig> {
    return this.http.post<CatiaAiPromptConfig>(
      `${this.apiURL}/seed-default`,
      null
    );
  }
}
