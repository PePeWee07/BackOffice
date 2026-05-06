import { HttpBackend, HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface HealthCheckResult {
  name: string;
  url: string;
  port: string;
  status: 'online' | 'offline';
  statusCode: number | null;
  message: string;
  checkedAt: Date;
  response: unknown;
}

interface HealthEndpoint {
  name: string;
  baseUrl: string;
  healthPath: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatiaHealthService {
  private readonly http: HttpClient;

  private readonly endpoints: HealthEndpoint[] = [
    environment.microservices.catiaCore,
    environment.microservices.ticAiSupport,
    environment.microservices.webhookWhatsapp,
  ];

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  getServicesHealth(): Observable<HealthCheckResult[]> {
    return forkJoin(this.endpoints.map((endpoint) => this.checkEndpoint(endpoint)));
  }

  private checkEndpoint(endpoint: HealthEndpoint): Observable<HealthCheckResult> {
    const url = this.buildUrl(endpoint.baseUrl, endpoint.healthPath);

    return this.http
      .get(url, {
        observe: 'response',
        responseType: 'json',
      })
      .pipe(
        timeout(4000),
        map((response) => this.mapSuccessResponse(endpoint, url, response)),
        catchError((error) => of(this.mapErrorResponse(endpoint, url, error)))
      );
  }

  private mapSuccessResponse(
    endpoint: HealthEndpoint,
    url: string,
    response: HttpResponse<unknown>
  ): HealthCheckResult {
    const payload = this.toRecord(response.body);

    return {
      name: endpoint.name,
      url,
      port: this.extractPort(endpoint.baseUrl),
      status: 'online',
      statusCode: response.status,
      message:
        this.extractMessage(payload) ??
        `Disponible${response.status ? ` (${response.status})` : ''}`,
      checkedAt: new Date(),
      response: response.body,
    };
  }

  private mapErrorResponse(
    endpoint: HealthEndpoint,
    url: string,
    error: unknown
  ): HealthCheckResult {
    const httpError = error as HttpErrorResponse;
    const payload = this.toRecord(httpError?.error);

    return {
      name: endpoint.name,
      url,
      port: this.extractPort(endpoint.baseUrl),
      status: 'offline',
      statusCode: httpError?.status ?? null,
      message:
        this.extractMessage(payload) ??
        httpError?.message ??
        'No fue posible consultar el servicio',
      checkedAt: new Date(),
      response: httpError?.error ?? null,
    };
  }

  private buildUrl(baseUrl: string, path: string): string {
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }

  private extractPort(baseUrl: string): string {
    try {
      return new URL(baseUrl).port || '80';
    } catch {
      return 'N/D';
    }
  }

  private extractMessage(payload: Record<string, unknown> | null): string | null {
    if (!payload) {
      return null;
    }

    const possibleKeys = ['message', 'status', 'detail', 'description'];

    for (const key of possibleKeys) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return null;
  }
}
